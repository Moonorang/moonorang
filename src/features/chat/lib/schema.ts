import type { ChatRequestBody } from '@/features/chat/types';

type ParseResult =
  | { ok: true; data: ChatRequestBody }
  | { ok: false; message: string };

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

  return { ok: true, data: { message, keywords } };
}
