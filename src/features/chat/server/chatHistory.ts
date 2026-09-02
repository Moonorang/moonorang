import { getPlansByIds } from '@/entities/plan/server/planRepository';
import { tryParseCardPayload } from '@/features/chat/lib/chatCard';
import {
  getActiveChat,
  getChatMessages,
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
  const planIds = [
    ...new Set(
      markers
        .filter((marker) => marker.target.kind === 'plan')
        .map((marker) => marker.target.itemId),
    ),
  ];
  const plans = await getPlansByIds(planIds);
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  return markers.reduce<JoinBlock[]>((acc, marker) => {
    const { afterMessageId, progress, isCompleted } = marker;

    if (marker.target.kind === 'plan') {
      const plan = planById.get(marker.target.itemId);
      if (plan) {
        acc.push({
          kind: 'plan',
          item: plan,
          afterMessageId,
          progress,
          isCompleted,
        });
      }
    }

    return acc;
  }, []);
}

/**
 * CHAT-012 회원판 - 화면을 벗어났다 돌아와도, 회원은 DB에 있는 대화·카드를 그대로
 * 복구해서 보여준다. 아직 대화를 시작 안 한 회원(세션 없음)이면 빈 상태를 돌려준다.
 */
export async function loadMemberChatHistory(
  userId: string,
): Promise<MemberChatHistory> {
  const chat = await getActiveChat(userId);
  if (!chat) return { messages: [], joinBlocks: [], keywords: {} };

  const rows = await getChatMessages(chat.id);
  const { messages, joinMarkers } = splitRows(rows);

  const joinBlocks = await restoreJoinBlocks(joinMarkers);

  return { messages, joinBlocks, keywords: chat.keywords };
}
