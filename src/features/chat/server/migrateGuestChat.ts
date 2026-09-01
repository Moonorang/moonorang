import { serializeCardPayload } from '@/features/chat/lib/chatCard';
import {
  getOrCreateActiveChat,
  insertMessages,
  updateChatKeywords,
  upsertChatSummary,
} from '@/features/chat/server/chatRepository';
import type { ChatKeywords, ChatMessage, PlanJoinBlock } from '@/features/chat/types';

interface MigrateGuestChatParams {
  messages: ChatMessage[];
  joinBlocks: PlanJoinBlock[];
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

      rows.push({ role: 'user', content: `${block.plan.name} 요금제 가입할래` });
      rows.push({
        role: 'ai',
        content: serializeCardPayload({ type: 'join_flow', planId: block.plan.id }),
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
  const lastMessage = inserted[inserted.length - 1];
  if (summary && lastMessage) {
    tasks.push(upsertChatSummary(chat.id, summary, Number(lastMessage.id)));
  }

  await Promise.all(tasks);
}
