import { getAddOnsByIds } from '@/entities/addOn/server';
import { getPlansByIds } from '@/entities/plan/server/planRepository';
import { getSubscriptionsByIds } from '@/entities/subscription/server';
import { tryParseCardPayload } from '@/features/chat/lib/chatCard';
import { dedupeJoinBlocks } from '@/features/chat/lib/joinBlock';
import {
  getActiveChat,
  getChatMessages,
  getChatSummary,
  type DbChatMessage,
} from '@/features/chat/server/chatRepository';
import type {
  ChatKeywords,
  ChatMessage,
  JoinBlock,
} from '@/features/chat/types';

import type { JoinProgress, JoinTarget } from '@/entities/join/types';

export interface MemberChatHistory {
  messages: ChatMessage[];
  joinBlocks: JoinBlock[];
  keywords: ChatKeywords;
  /**
   * 화면 표시용 요약 - chatStream.ts가 LLM 컨텍스트용으로 이미 관리하는
   * chat_summary를 그대로 빌려 쓴다(§2.6). 클라이언트는 이걸 시작점으로 삼아
   * 비회원과 같은 방식(useChat의 summarizeIfNeeded/pruneVisibleMessages)으로
   * 화면 유지 상한을 넘는 오래된 대화를 걷어낸다 - 단, DB 원본은 그대로 남아있어
   * 비회원처럼 사라지지는 않는다.
   */
  summary: string;
  /** summary가 messages 중 몇 턴까지 반영했는지 - pruneVisibleMessages가 이 값을
   * 넘어서는 절대 걷어내지 않는다(아직 요약 안 된 턴 보호). */
  summarizedTurnCount: number;
}

interface PendingJoinMarker {
  target: JoinTarget;
  /** null 이면 대화 맨 앞 - 앞에 아무 메시지도 없이 카드부터 시작한 대화다 */
  afterMessageId: string | null;
  /** CARD-046: 절차를 어디까지 밟았는지 */
  progress?: JoinProgress;
  /** CARD-043: 결제까지 마쳤는지 */
  isCompleted?: boolean;
}

/**
 * DB 행을 화면이 바로 쓸 수 있는 모양으로 되돌린다 - chatStream.ts가 저장할 때 쓴
 * 규칙(카드 마커 행)을 그대로 반대로 읽는다.
 * - join_flow 마커: 그 앞의 "OO 가입할래" 사용자 행을 대화에서 빼서 가입
 *   카드 자리로 돌린다 (라이브 화면에서 joinBlocks가 렌더되는 방식과 동일).
 *   진행 상태·완료 여부도 이 마커에 실려 있어 그대로 되살린다.
 * - join_result/recommendation/usage_analysis 마커: 바로 앞 AI 메시지에 그대로 붙인다.
 */
function splitRows(rows: DbChatMessage[]): {
  messages: ChatMessage[];
  joinMarkers: PendingJoinMarker[];
} {
  const messages: ChatMessage[] = [];
  const joinMarkers: PendingJoinMarker[] = [];

  for (const row of rows) {
    const card = row.role === 'ai' ? tryParseCardPayload(row.content) : null;

    if (card?.type === 'join_flow') {
      // 바로 앞의 "OO 가입할래" 사용자 행은 카드가 스스로 그리므로 대화에서 뺀다
      messages.pop();
      joinMarkers.push({
        target: { kind: card.kind, itemId: card.itemId },
        // 그러고도 앞에 남은 메시지가 없으면 이 카드가 대화의 시작이다
        afterMessageId: messages[messages.length - 1]?.id ?? null,
        progress: card.progress,
        isCompleted: card.isCompleted,
      });
      continue;
    }

    if (card?.type === 'join_result') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.joinResultKind = card.kind;
      continue;
    }

    if (card?.type === 'recommendation') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.recommendations = card.plans;
      continue;
    }

    if (card?.type === 'add_on_recommendation') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.addOnRecommendations = card.addOns;
      continue;
    }

    if (card?.type === 'subscription_recommendation') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') {
        last.subscriptionRecommendations = card.subscriptions;
      }
      continue;
    }

    if (card?.type === 'nearby_membership') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.nearbyMemberships = card.memberships;
      continue;
    }

    if (card?.type === 'usage_analysis') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.usageAnalysis = card.data;
      continue;
    }

    messages.push({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    });
  }

  return { messages, joinMarkers };
}

/**
 * 마커에 남아 있는 것은 상품 번호뿐이라, 실제 값은 종류별로 다시 조회해서 채운다
 * (CARD-001과 같은 원칙 - 그때 화면에 뿌린 값을 그대로 저장해두는 추천 카드와 달리,
 * 가입 카드는 지금의 요금제 정보로 절차를 밟아야 하므로 번호만 남긴다).
 *
 * 지워진 상품을 가리키는 마커는 조용히 버린다 - 그릴 수 없는 카드를 억지로
 * 되살리는 것보다, 그 자리에 카드만 안 보이는 편이 낫다.
 */
async function restoreJoinBlocks(
  markers: PendingJoinMarker[],
): Promise<JoinBlock[]> {
  // 종류별로 한 번씩만 조회한다 - 마커 하나마다 부르면 카드 수만큼 왕복하게 된다
  const idsOf = (kind: JoinTarget['kind']) => [
    ...new Set(
      markers
        .filter((marker) => marker.target.kind === kind)
        .map((marker) => marker.target.itemId),
    ),
  ];

  const [plans, addOns, subscriptions] = await Promise.all([
    getPlansByIds(idsOf('plan')),
    getAddOnsByIds(idsOf('addOn')),
    getSubscriptionsByIds(idsOf('subscription')),
  ]);
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const addOnById = new Map(addOns.map((addOn) => [addOn.id, addOn]));
  const subscriptionById = new Map(
    subscriptions.map((subscription) => [subscription.id, subscription]),
  );

  // 같은 상품 마커가 여러 개 남아 있을 수 있다 - 가입했다가 로그아웃하고 같은
  // 상품을 다시 연 경우다. 카드는 한 장만 세운다(dedupeJoinBlocks 주석 참고).
  return dedupeJoinBlocks(
    markers.reduce<JoinBlock[]>((acc, marker) => {
      const { target, afterMessageId, progress, isCompleted } = marker;
      const base = { afterMessageId, progress, isCompleted };

      // if 를 늘어놓지 않고 switch 로 두는 이유는 default 의 never 검사 때문이다.
      // 종류가 늘었는데 여기 갈래를 안 더하면 컴파일이 막힌다 - 예전에 이 자리를
      // 빠뜨려서 부가서비스·구독 카드가 조용히 안 살아난 적이 있다.
      switch (target.kind) {
        case 'plan': {
          const plan = planById.get(target.itemId);
          if (plan) acc.push({ ...base, kind: 'plan', item: plan });
          break;
        }
        case 'addOn': {
          const addOn = addOnById.get(target.itemId);
          if (addOn) acc.push({ ...base, kind: 'addOn', item: addOn });
          break;
        }
        case 'subscription': {
          const subscription = subscriptionById.get(target.itemId);
          if (subscription) {
            acc.push({ ...base, kind: 'subscription', item: subscription });
          }
          break;
        }
        default: {
          // 여기까지 왔다면 위 갈래가 모자란 것이다. 대화 복구 전체를 막지는 않고
          // (그 카드만 빠진다) 로그로 남긴다.
          const unhandledKind: never = target.kind;
          console.error('[chat] 복구할 수 없는 가입 카드 종류', unhandledKind);
        }
      }

      return acc;
    }, []),
  );
}

/**
 * chat_summary.last_message_id(원본 chat_messages 행 id)가 복구된 messages 배열의
 * 몇 번째 완결된 턴까지에 해당하는지 계산한다. 카드 마커 행은 splitRows가 이미
 * 접어 넣었으므로(messages에 별도 항목으로 안 남음) messages 안에서 그 id를 가진
 * 행을 찾아 순번으로 턴 수를 셀 수 있다.
 *
 * 못 찾으면(예: 아직 요약이 한 번도 안 된 대화) 0을 돌려준다 - pruneVisibleMessages는
 * 이 값을 넘어서는 절대 걷어내지 않으므로, 0은 "아직 아무것도 못 걷어낸다"는
 * 안전한 기본값이다.
 */
function resolveSummarizedTurnCount(
  messages: ChatMessage[],
  lastMessageId: number | null,
): number {
  if (lastMessageId === null) return 0;

  const index = messages.findIndex((m) => m.id === String(lastMessageId));
  if (index === -1) return 0;

  return Math.floor((index + 1) / 2);
}

/**
 * CHAT-012 회원판 - 화면을 벗어났다 돌아와도, 회원은 DB에 있는 대화·카드를 그대로
 * 복구해서 보여준다. 아직 대화를 시작 안 한 회원(세션 없음)이면 빈 상태를 돌려준다.
 */
export async function loadMemberChatHistory(
  userId: string,
): Promise<MemberChatHistory> {
  const chat = await getActiveChat(userId);
  if (!chat) {
    return {
      messages: [],
      joinBlocks: [],
      keywords: {},
      summary: '',
      summarizedTurnCount: 0,
    };
  }

  const [rows, summaryRow] = await Promise.all([
    getChatMessages(chat.id),
    getChatSummary(chat.id),
  ]);
  const { messages, joinMarkers } = splitRows(rows);

  const joinBlocks = await restoreJoinBlocks(joinMarkers);

  return {
    messages,
    joinBlocks,
    keywords: chat.keywords,
    summary: summaryRow?.summary ?? '',
    summarizedTurnCount: resolveSummarizedTurnCount(
      messages,
      summaryRow?.lastMessageId ?? null,
    ),
  };
}
