import { getCurrentUser } from '@/features/auth/server';
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

  // CARD-023: 절약 상담(analyze_savings/show_usage_trend)은 로그인 사용자 전용이라,
  // chatStream이 여기서 미리 확인한 로그인 여부를 받아서 판단한다
  // (features/chat은 다른 feature인 features/auth를 직접 import할 수 없어서).
  const user = await getCurrentUser();

  return new Response(
    createChatStream(
      parsed.data.message,
      parsed.data.keywords ?? {},
      parsed.data.summary,
      user?.id ?? null,
      parsed.data.recentMessages ?? [],
    ),
    { headers: SSE_HEADERS },
  );
}
