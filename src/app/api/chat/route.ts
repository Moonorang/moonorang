import { parseChatRequest } from '@/features/chat/lib/schema';
import { formatSSEEvent, SSE_HEADERS } from '@/features/chat/lib/sse';
import { createChatStream } from '@/features/chat/server/chatStream';

export async function POST(request: Request) {
  const parsed = parseChatRequest(await request.json());

  if (!parsed.ok) {
    return new Response(
      formatSSEEvent({
        event: 'error',
        data: { reason: 'invalid_format', message: parsed.message },
      }),
      { status: 400, headers: SSE_HEADERS },
    );
  }

  return new Response(createChatStream(parsed.data.message), {
    headers: SSE_HEADERS,
  });
}
