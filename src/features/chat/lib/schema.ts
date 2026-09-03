import type {
  ChatKeywordsRequestBody,
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

/** 관심사 하나의 최대 길이 - 칩 목록에서 고르는 값이라 이보다 길 이유가 없다 */
const MAX_INTEREST_LENGTH = 30;
/** 관심사 개수 상한 - 목록(INTEREST_KEYWORDS)보다 넉넉히 두되, 무한정 쌓이진 않게 한다 */
const MAX_INTEREST_COUNT = 50;

/**
 * 관심사 목록을 저장 가능한 모양으로 다듬는다 - 공백 제거, 빈 값·중복 제거,
 * 길이·개수 상한. 클라이언트가 보낸 값을 그대로 DB에 넣지 않기 위한 것이라
 * 서버에서 쓰지만, 순수 함수라 필요하면 클라이언트에서도 쓸 수 있다.
 */
export function normalizeInterests(values: string[]): string[] {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= MAX_INTEREST_LENGTH);

  return Array.from(new Set(normalized)).slice(0, MAX_INTEREST_COUNT);
}

type KeywordsParseResult =
  | { ok: true; data: ChatKeywordsRequestBody }
  | { ok: false; message: string };

/** POST /api/chat/keywords 요청 바디 검증 */
export function parseChatKeywordsRequest(body: unknown): KeywordsParseResult {
  const parsed = body as Partial<ChatKeywordsRequestBody> | null;
  const interests = parsed?.interests;

  // 다른 요청과 달리 형식이 안 맞으면 조용히 빈 값으로 넘어가지 않는다 - 사용자가
  // 방금 고른 것을 저장하는 요청이라, 잘못된 요청을 성공으로 답하면 저장된 줄 알고
  // 넘어가게 된다.
  if (
    !Array.isArray(interests) ||
    !interests.every((value) => typeof value === 'string')
  ) {
    return { ok: false, message: '관심사 목록의 형식이 올바르지 않습니다.' };
  }

  return { ok: true, data: { interests: normalizeInterests(interests) } };
}
