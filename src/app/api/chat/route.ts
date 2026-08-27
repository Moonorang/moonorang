import { APIConnectionTimeoutError, APIError } from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { openai, OPENAI_MODEL } from '@/lib/openai';
import type { ChatRequestBody, ChatStreamEvent } from '@/types/chat';

// 응 답 대기는 최대 60초로 제한
const REQUEST_TIMEOUT_MS = 60_000;

function formatSSE(event: ChatStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

// api/chat - SSE 스트리밍
// 순수 텍스트 토큰만 흘려보내는 중
// TODO: tool calling
export async function POST(request: Request) {
  const { message }: ChatRequestBody = await request.json();

  if (typeof message !== 'string' || !message.trim()) {
    return new Response(
      formatSSE({
        event: 'error',
        data: { reason: 'invalid_format', message: '메시지를 입력해주세요.' },
      }),
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } },
    );
  }

  const encoder = new TextEncoder();
  // 클라이언트가 연결을 끊었을 때 cancel() 에서 이 스트림을 마저 정리
  let activeStream: Stream<ChatCompletionChunk> | null = null;

  const body = new ReadableStream({
    async start(controller) {
      try {
        activeStream = await openai.chat.completions.create(
          {
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: message }],
            stream: true,
          },
          { timeout: REQUEST_TIMEOUT_MS },
        );

        for await (const chunk of activeStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(formatSSE({ event: 'token', data: { delta } })),
            );
          }
        }

        controller.enqueue(
          encoder.encode(formatSSE({ event: 'done', data: {} })),
        );
      } catch (error) {
        // 사유 구분해서 안내
        console.error('[api/chat] 스트리밍 실패:', error);

        const reason =
          error instanceof APIConnectionTimeoutError
            ? 'timeout'
            : 'runtime_unavailable';

        controller.enqueue(
          encoder.encode(
            formatSSE({
              event: 'error',
              data: {
                reason,
                message:
                  error instanceof APIError
                    ? error.message
                    : 'LLM 응답 생성에 실패했습니다.',
              },
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      activeStream?.controller.abort();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
