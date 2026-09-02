import { serializeCardPayload } from '@/features/chat/lib/chatCard';
import {
  getJoinBlockMessage,
  getJoinBlockTarget,
} from '@/features/chat/lib/joinBlock';
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
  if (messages.length === 0) return;

  const chat = await getOrCreateActiveChat(userId);

  const rows: { role: 'user' | 'ai'; content: string }[] = [];

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

      rows.push({ role: 'user', content: getJoinBlockMessage(block) });
      rows.push({
        role: 'ai',
        content: serializeCardPayload({
          type: 'join_flow',
          ...getJoinBlockTarget(block),
        }),
      });
    }
  }

  const inserted = await insertMessages(chat.id, rows);

  const tasks: Promise<unknown>[] = [];

  if (Object.keys(keywords).length > 0) {
    tasks.push(updateChatKeywords(chat.id, keywords));
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
