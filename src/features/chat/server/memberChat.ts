import { tryParseCardPayload, serializeCardPayload } from '@/features/chat/lib/chatCard';
import {
  getChatMessages,
  getChatSummary,
  getOrCreateActiveChat,
  insertMessage,
  insertMessages,
  updateChatKeywords,
  upsertChatSummary,
  type DbChatMessage,
} from '@/features/chat/server/chatRepository';
import { summarizeConversation } from '@/features/chat/server/summarizeConversation';
import {
  SUMMARIZE_KEEP_RECENT_TURNS,
  SUMMARIZE_TURN_THRESHOLD,
} from '@/features/chat/constants';
import type { ChatCardPayload, ChatKeywords, SummarizeTurnMessage } from '@/features/chat/types';

export interface MemberChatContext {
  chatId: string;
  keywords: ChatKeywords;
  summary?: string;
  /** §2.4 "최근 채팅 메시지 N개" - chat_summary.last_message_id 이후 구간의 원문 */
  recentMessages: SummarizeTurnMessage[];
}

// 카드 마커 행(추천/절약/가입 마커)은 실제 대화 내용이 아니라 UI 복원용 데이터라,
// LLM에게 보낼 최근 대화나 요약 대상에서는 뺀다 - JSON 텍스트를 대화로 오인시키지
// 않기 위함이다. "OO 요금제 가입할래"처럼 마커 앞에 붙는 사용자 발화는 실제 문맥으로
// 유효하므로 그대로 둔다.
function isRealConversationRow(row: DbChatMessage): boolean {
  if (row.role !== 'ai') return true;
  return tryParseCardPayload(row.content) === null;
}

// chat_summary.last_message_id 이후(아직 요약 안 된) 구간만, 카드 마커를 뺀 채로 돌려준다.
function selectUnsummarized(
  messages: DbChatMessage[],
  lastMessageId: number | null,
): DbChatMessage[] {
  const afterLast =
    lastMessageId === null
      ? messages
      : messages.slice(
          messages.findIndex((m) => Number(m.id) === lastMessageId) + 1,
        );

  return afterLast.filter(isRealConversationRow);
}

// 턴 수는 "행 개수 / 2"가 아니라 사용자 발화 개수로 센다 - 가입 카드처럼 한 턴에
// AI 행이 여러 개(텍스트+카드 마커) 붙거나 아예 없는 경우가 있어 행 개수 기반
// 계산은 어긋나기 때문이다.
function countTurns(messages: DbChatMessage[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

/**
 * 회원이면 이번 요청에 쓸 조건·요약·최근 대화를 DB에서 읽어온다(클라이언트가 보낸
 * keywords/summary/recentMessages는 회원에게는 안 쓴다 - DB가 유일한 진짜 기록이므로).
 * 첫 메시지면 세션을 새로 만든다(CHAT-011 회원 버전).
 */
export async function loadMemberChatContext(
  userId: string,
): Promise<MemberChatContext> {
  const chat = await getOrCreateActiveChat(userId);
  const [messages, summaryRow] = await Promise.all([
    getChatMessages(chat.id),
    getChatSummary(chat.id),
  ]);

  const unsummarized = selectUnsummarized(
    messages,
    summaryRow?.lastMessageId ?? null,
  );

  return {
    chatId: chat.id,
    keywords: chat.keywords,
    summary: summaryRow?.summary,
    recentMessages: unsummarized.map((m) => ({ role: m.role, content: m.content })),
  };
}

/** 이번 턴의 사용자 발화를 곧바로 저장한다 - 이후 AI 응답이 실패해도 사용자가
 * 실제로 한 말은 기록에 남아있어야 한다(재시도하면 다음 메시지로 이어짐). */
export async function persistMemberUserMessage(
  chatId: string,
  userText: string,
): Promise<void> {
  await insertMessage(chatId, 'user', userText);
}

/**
 * AI 응답이 확정된 뒤 저장한다. 빈 텍스트(도구만 부르고 끝난 턴 등)는 건너뛴다.
 * 이번 턴에 실제로 화면에 보낸 카드(recommendation/usage_analysis)가 있으면 그
 * 스냅샷을 그대로 뒤이어 저장해서, 나중에 복구했을 때 "그때 봤던 카드"가 그대로
 * 다시 보이게 한다(가격 등이 나중에 바뀌어도 상담 당시 값 그대로 - CHAT-012 회원판).
 * 요약은 응답 지연에 영향 안 주도록 비동기로 처리한다(§2.6과 같은 원칙).
 */
export async function persistMemberAiTurn(
  chatId: string,
  aiText: string,
  keywords: ChatKeywords,
  cards: ChatCardPayload[] = [],
): Promise<void> {
  // 텍스트 행이 카드 마커 행보다 반드시 먼저 저장돼야 한다 - 복구 시 "마커 바로 앞
  // AI 텍스트 메시지에 붙인다"는 규칙이 삽입 순서(id 오름차순)에 의존하기 때문이다.
  // 이 둘을 Promise.all로 동시에 실행하면 네트워크 타이밍에 따라 카드 마커가 먼저
  // 커밋돼버릴 수 있어(그러면 복구 시 마커 앞에 텍스트가 없어 조용히 버려진다),
  // 반드시 순차 실행한다. keywords 갱신은 메시지 순서와 무관해 병렬로 둔다.
  const insertOrderedMessages = async () => {
    if (aiText.trim()) {
      await insertMessage(chatId, 'ai', aiText);
    }
    if (cards.length > 0) {
      await insertMessages(
        chatId,
        cards.map((card) => ({
          role: 'ai' as const,
          content: serializeCardPayload(card),
        })),
      );
    }
  };

  await Promise.all([insertOrderedMessages(), updateChatKeywords(chatId, keywords)]);

  void summarizeMemberChatIfNeeded(chatId).catch((error: unknown) => {
    console.error('[chat] 회원 대화 요약 실패:', error);
  });
}

async function summarizeMemberChatIfNeeded(chatId: string): Promise<void> {
  const [messages, summaryRow] = await Promise.all([
    getChatMessages(chatId),
    getChatSummary(chatId),
  ]);

  const lastMessageId = summaryRow?.lastMessageId ?? null;
  const unsummarized = selectUnsummarized(messages, lastMessageId);
  const unsummarizedTurns = countTurns(unsummarized);

  if (unsummarizedTurns < SUMMARIZE_TURN_THRESHOLD) return;

  const turnCount = unsummarizedTurns - SUMMARIZE_KEEP_RECENT_TURNS;
  if (turnCount <= 0) return;

  // turnCount번째 사용자 발화 다음 지점(=keepRecentTurns턴이 시작되는 지점)까지 자른다
  let userSeen = 0;
  let cutIndex = unsummarized.length;
  for (let i = 0; i < unsummarized.length; i++) {
    if (unsummarized[i]?.role !== 'user') continue;
    userSeen += 1;
    if (userSeen === turnCount + 1) {
      cutIndex = i;
      break;
    }
  }

  const turnsToSummarize = unsummarized.slice(0, cutIndex);
  const lastIncludedMessage = turnsToSummarize[turnsToSummarize.length - 1];
  if (!lastIncludedMessage) return;

  const summary = await summarizeConversation(
    turnsToSummarize.map((m) => ({ role: m.role, content: m.content })),
    summaryRow?.summary,
  );

  await upsertChatSummary(chatId, summary, Number(lastIncludedMessage.id));
}
