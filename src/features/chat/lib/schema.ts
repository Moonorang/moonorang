import type {
  ChatRequestBody,
  ChatSummarizeRequestBody,
  SummarizeTurnMessage,
} from '@/features/chat/types';

type ParseResult =
  { ok: true; data: ChatRequestBody } | { ok: false; message: string };

/**
 * /api/chat 요청 바디 검증.
 * 서버·클라이언트 양쪽에서 쓸 수 있도록 외부 의존 없이 순수 함수로 둔다.
 */
export function parseChatRequest(body: unknown): ParseResult {
  const parsed = body as Partial<ChatRequestBody> | null;
  const message = parsed?.message;

  if (typeof message !== 'string' || !message.trim()) {
    return { ok: false, message: '메시지를 입력해주세요.' };
  }

  // keywords는 클라이언트가 들고 있다가 실어 보내는 값이라(CHAT-011),
  // 형식이 안 맞아도 대화 자체를 막지 않고 빈 값으로 조용히 대체한다.
  const keywords =
    parsed?.keywords && typeof parsed.keywords === 'object'
      ? parsed.keywords
      : {};

  // summary도 keywords와 같은 이유로, 형식이 안 맞으면 그냥 없는 것으로 취급한다.
  const summary = typeof parsed?.summary === 'string' ? parsed.summary : undefined;

  // recentMessages(§2.4 "최근 채팅 메시지 N개")도 같은 이유로, 형식이 안 맞으면
  // 빈 배열로 대체한다 - 대화 자체를 막을 이유는 아니고, 다만 이번 요청에서
  // 짧은 기억 공백이 생길 뿐이다.
  const recentMessages =
    Array.isArray(parsed?.recentMessages) &&
    parsed.recentMessages.every(isSummarizeTurnMessage)
      ? parsed.recentMessages
      : [];

  // location(CARD-028)도 같은 이유로, 형식이 안 맞거나 없으면 그냥 생략한다 -
  // find_nearby_memberships가 없는 채로 알아서 ok: false 처리한다.
  const location = isValidLocation(parsed?.location) ? parsed.location : undefined;

  return { ok: true, data: { message, keywords, summary, recentMessages, location } };
}

function isValidLocation(
  value: unknown,
): value is { lat: number; lng: number } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<{ lat: unknown; lng: unknown }>;
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number';
}

type SummarizeParseResult =
  | { ok: true; data: ChatSummarizeRequestBody }
  | { ok: false; message: string };

export function isSummarizeTurnMessage(
  value: unknown,
): value is SummarizeTurnMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SummarizeTurnMessage>;

  return (
    (candidate.role === 'user' || candidate.role === 'ai') &&
    typeof candidate.content === 'string'
  );
}

/** /api/chat/summarize 요청 바디 검증 */
export function parseChatSummarizeRequest(body: unknown): SummarizeParseResult {
  const parsed = body as Partial<ChatSummarizeRequestBody> | null;

  if (!Array.isArray(parsed?.messages) || parsed.messages.length === 0) {
    return { ok: false, message: '요약할 대화가 없습니다.' };
  }
  if (!parsed.messages.every(isSummarizeTurnMessage)) {
    return { ok: false, message: '요약할 대화 형식이 올바르지 않습니다.' };
  }

  const existingSummary =
    typeof parsed.existingSummary === 'string' ? parsed.existingSummary : undefined;

  return { ok: true, data: { messages: parsed.messages, existingSummary } };
}
