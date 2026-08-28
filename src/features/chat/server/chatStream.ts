import { APIConnectionTimeoutError, APIError } from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { getAllPlans } from '@/entities/plan/server/planRepository';
import { createSSESender } from '@/features/chat/lib/sse';
import { streamCompletion } from '@/features/chat/server/openaiStream';
import { handleRecommendPlansCall } from '@/features/chat/server/recommendPlans';
import { buildSystemPrompt } from '@/features/chat/server/systemPrompt';

/**
 * 한 번의 상담 요청을 SSE 스트림으로 만든다.
 *
 * 1턴: 시스템 프롬프트 + 사용자 메시지로 호출.
 *      텍스트는 곧바로 token 이벤트로 흘려보내고, recommend_plans 를 호출했으면 모아둔다.
 * 2턴: tool_calls 가 있었으면 조회 결과를 tool 메시지로 넣고 다시 호출해
 *      자연어 마무리 응답을 스트리밍한다. tool_calls 가 없으면 1턴으로 끝난다.
 */
export function createChatStream(message: string): ReadableStream {
  // 클라이언트가 연결을 끊었을 때(페이지 이동 등) cancel() 에서 진행 중인 스트림을 정리
  let activeStream: Stream<ChatCompletionChunk> | null = null;

  const rememberStream = (stream: Stream<ChatCompletionChunk>) => {
    activeStream = stream;
  };

  return new ReadableStream({
    async start(controller) {
      const send = createSSESender(controller);

      try {
        const plans = await getAllPlans();
        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: buildSystemPrompt(plans) },
          { role: 'user', content: message },
        ];

        const toolCalls = await streamCompletion({
          messages,
          useTools: true,
          send,
          onStreamCreated: rememberStream,
        });

        const recommendCall = toolCalls.find(
          (call) => call.name === 'recommend_plans',
        );

        if (recommendCall) {
          const followUpMessages = await handleRecommendPlansCall(
            recommendCall,
            send,
          );

          if (followUpMessages) {
            await streamCompletion({
              messages: [...messages, ...followUpMessages],
              useTools: false,
              send,
              onStreamCreated: rememberStream,
            });
          }
        }

        send({ event: 'done', data: {} });
      } catch (error) {
        // CARD-005: 실패 사유를 구분해서 안내
        console.error('[api/chat] 스트리밍 실패:', error);

        send({
          event: 'error',
          data: {
            reason:
              error instanceof APIConnectionTimeoutError
                ? 'timeout'
                : 'runtime_unavailable',
            message:
              error instanceof APIError
                ? error.message
                : 'LLM 응답 생성에 실패했습니다.',
          },
        });
      } finally {
        controller.close();
      }
    },

    cancel() {
      activeStream?.controller.abort();
    },
  });
}
