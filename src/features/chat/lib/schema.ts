import type { ChatRequestBody } from '@/features/chat/types';

type ParseResult =
  { ok: true; data: ChatRequestBody } | { ok: false; message: string };

/**
 * /api/chat 요청 바디 검증.
 * 서버·클라이언트 양쪽에서 쓸 수 있도록 외부 의존 없이 순수 함수로 둔다.
 */
export function parseChatRequest(body: unknown): ParseResult {
  const message = (body as Partial<ChatRequestBody> | null)?.message;

  if (typeof message !== 'string' || !message.trim()) {
    return { ok: false, message: '메시지를 입력해주세요.' };
  }

  return { ok: true, data: { message } };
}
