import { serializeCardPayload } from '@/features/chat/lib/chatCard';
import {
  getJoinBlockMessage,
  getJoinBlockTarget,
} from '@/features/chat/lib/joinBlock';
import { mergeKeywords } from '@/features/chat/lib/mergeKeywords';
import {
  getChatSummary,
  getOrCreateActiveChat,
  insertMessages,
  updateChatKeywords,
  upsertChatSummary,
} from '@/features/chat/server/chatRepository';
import { mergeSummaries } from '@/features/chat/server/summarizeConversation';
import type {
  ChatKeywords,
  ChatMessage,
  JoinBlock,
} from '@/features/chat/types';

interface MigrateGuestChatParams {
  messages: ChatMessage[];
  joinBlocks: JoinBlock[];
  keywords: ChatKeywords;
  /** 게스트일 때 이미 요약돼있던 이전 대화 - 있으면 DB 쪽에도 이어서 남긴다 */
  summary?: string;
}

/**
 * CHAT-011/012 "로그인 전환": 비회원으로 나눈 대화를 로그인 순간 서버로 승계한다.
 * chatHistory.ts의 splitRows(DB 행 -> 화면 모양)를 뒤집은 방향 - 화면에 있던
 * messages/joinBlocks를 다시 DB 행 순서로 펼쳐서 한 번에 저장한다.
 */
export async function migrateGuestChat(
  userId: string,
  { messages, joinBlocks, keywords, summary }: MigrateGuestChatParams,
): Promise<void> {
  // 말은 없고 가입 카드만 있는 대화도 승계 대상이다(useChat 의 hasGuestConversation 과 같은 이유)
  if (messages.length === 0 && joinBlocks.length === 0) return;

  const chat = await getOrCreateActiveChat(userId);

  const rows: { role: 'user' | 'ai'; content: string }[] = [];

  /**
   * 가입 카드 한 장을 DB 행 두 줄(사용자 말풍선 + 마커)로 펼친다.
   *
   * CARD-046: 진행 상태를 함께 실어야 한다. 비회원으로 절차를 밟다가 결제 단계에서
   * 카카오 회원가입으로 넘어가는 길(CARD-044)이 정확히 이 경로라, 여기서 progress 를
   * 빠뜨리면 돌아왔을 때 카드는 뜨는데 첫 단계부터 다시 시작하게 된다.
   *
   * isCompleted 는 싣지 않는다 - 결제는 회원만 할 수 있어서(JoinFlowCard 의
   * handlePayment) 비회원 카드가 완료 상태인 경우가 없다.
   */
  const pushJoinBlockRows = (block: JoinBlock) => {
    rows.push({ role: 'user', content: getJoinBlockMessage(block) });
    rows.push({
      role: 'ai',
      content: serializeCardPayload({
        type: 'join_flow',
        ...getJoinBlockTarget(block),
        ...(block.progress ? { progress: block.progress } : {}),
      }),
    });
  };

  // 대화 맨 앞에 붙은 카드가 먼저다 - 앞설 메시지가 없어서 아래 반복문에 안 걸린다
  for (const block of joinBlocks) {
    if (block.afterMessageId === null) pushJoinBlockRows(block);
  }

  for (const message of messages) {
    rows.push({ role: message.role, content: message.content });

    if (message.role === 'ai' && message.recommendations?.length) {
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'recommendation',
          plans: message.recommendations,
        }),
      });
    }

    if (message.role === 'ai' && message.addOnRecommendations?.length) {
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'add_on_recommendation',
          addOns: message.addOnRecommendations,
        }),
      });
    }

    if (message.role === 'ai' && message.subscriptionRecommendations?.length) {
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'subscription_recommendation',
          subscriptions: message.subscriptionRecommendations,
        }),
      });
    }

    if (message.role === 'ai' && message.nearbyMemberships?.length) {
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'nearby_membership',
          memberships: message.nearbyMemberships,
        }),
      });
    }

    if (message.role === 'ai' && message.usageAnalysis) {
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'usage_analysis',
          data: message.usageAnalysis,
        }),
      });
    }

    for (const block of joinBlocks) {
      if (block.afterMessageId !== message.id) continue;

      pushJoinBlockRows(block);
    }
  }

  const inserted = await insertMessages(chat.id, rows);

  const tasks: Promise<unknown>[] = [];

  // 회원 쪽에 이미 있던 조건을 게스트 값으로 덮어쓰지 않고 병합한다 - 아래 요약과
  // 같은 이유다. 이 경로는 두 대화를 "이어서 보기"로 합치는 자리인데, 대화만 이어
  // 붙이고 조건은 게스트 것으로 갈아치우면 로그아웃 전에 말해둔 예산·데이터 사용량·
  // 관심사가 통째로 사라진다. 병합 규칙은 chat-api-design.md §2.5 그대로 -
  // 예산 같은 스칼라는 최신값(게스트)이 이기고, interests 는 합집합으로 쌓인다.
  if (Object.keys(keywords).length > 0) {
    tasks.push(
      updateChatKeywords(chat.id, mergeKeywords(chat.keywords, keywords)),
    );
  }

  // 게스트 때 이미 요약돼있던 구간이 있으면, 방금 넣은 마지막 메시지를 기준점으로
  // 그대로 이어붙인다 - 그래야 회원 전환 직후에도 8턴 카운트가 0부터 다시 시작하지
  // 않고, 게스트 시절 쌓아둔 압축 맥락을 그대로 이어받는다.
  //
  // 로그아웃 전 회원 쪽에도 이미 요약이 있었다면(둘 다 각자 8턴을 넘긴 경우) 단순
  // upsert로 덮어쓰면 안 된다 - chat_summary는 chat_id당 1행이라, 게스트 요약으로
  // 그냥 덮으면 로그아웃 전 대화가 요약에서 통째로 사라진다. 이때는 두 요약을
  // 합쳐서 하나로 만든다.
  const lastMessage = inserted[inserted.length - 1];
  if (summary && lastMessage) {
    const existingSummary = await getChatSummary(chat.id);
    const mergedSummary = existingSummary?.summary
      ? await mergeSummaries(existingSummary.summary, summary)
      : summary;

    tasks.push(
      upsertChatSummary(chat.id, mergedSummary, Number(lastMessage.id)),
    );
  }

  await Promise.all(tasks);
}
