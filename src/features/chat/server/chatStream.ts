import { APIConnectionTimeoutError, APIError } from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { getAllPlans } from '@/entities/plan/server/planRepository';
import { mergeKeywords } from '@/features/chat/lib/mergeKeywords';
import { createSSESender } from '@/features/chat/lib/sse';
import { streamCompletion } from '@/features/chat/server/openaiStream';
import { runPlanRecommendation } from '@/features/chat/server/recommendPlans';
import { buildSystemPrompt } from '@/features/chat/server/systemPrompt';
import { parseExtractConditionsArguments } from '@/features/chat/server/tools';
import type { ChatKeywords } from '@/features/chat/types';

/**
 * 한 번의 상담 요청을 SSE 스트림으로 만든다.
 *
 * 1턴: 시스템 프롬프트(+ 지금까지 파악된 조건) + 사용자 메시지로 호출.
 *      텍스트는 곧바로 token 이벤트로 흘려보내고, 이번 턴에 언급된 조건은
 *      extract_conditions로, 추천 의도는 recommend_plans(트리거)로 모아둔다.
 * 2턴: recommend_plans 가 호출됐으면 - 실제 순위는 서버가 계산해서 recommendation
 *      이벤트로 먼저 내보내고, 그 결과를 tool 메시지로 넣어 다시 호출해
 *      자연어 마무리 응답을 스트리밍한다.
 *      recommend_plans 가 없어도, 1턴이 tool만 부르고 텍스트를 하나도 안 보냈으면
 *      (조건만 언급한 메시지 등) 빈 말풍선을 막기 위해 같은 방식으로 2턴을 돌린다.
 *      둘 다 아니면(텍스트가 이미 있었으면) 1턴으로 끝난다.
 */
export function createChatStream(
  message: string,
  incomingKeywords: ChatKeywords,
): ReadableStream {
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
          { role: 'system', content: buildSystemPrompt(plans, incomingKeywords) },
          { role: 'user', content: message },
        ];

        // 1턴이 텍스트를 하나도 안 보내고 tool만 부르고 끝나는 경우가 있다
        // (예: 조건만 언급한 메시지에 extract_conditions만 호출하고 끝냄) -
        // 그러면 화면엔 빈 말풍선만 남으므로, 텍스트가 없었는지 여기서 추적해둔다.
        let hasStreamedText = false;
        const trackingSend: typeof send = (event) => {
          if (event.event === 'token' && event.data.delta) hasStreamedText = true;
          send(event);
        };

        const toolCalls = await streamCompletion({
          messages,
          useTools: true,
          send: trackingSend,
          onStreamCreated: rememberStream,
        });

        const extractCall = toolCalls.find(
          (call) => call.name === 'extract_conditions',
        );
        const recommendCall = toolCalls.find(
          (call) => call.name === 'recommend_plans',
        );

        const mergedKeywords = extractCall
          ? mergeKeywords(
              incomingKeywords,
              parseExtractConditionsArguments(extractCall.argsBuffer),
            )
          : incomingKeywords;

        // recommend_plans는 항상 확정된 추천을 설명할 2턴이 필요하고,
        // 그게 아니어도 1턴이 텍스트 없이 tool만 부르고 끝났으면 빈 말풍선을 막기 위해 2턴을 돌린다.
        const needsFollowUpTurn =
          Boolean(recommendCall) ||
          (Boolean(extractCall) && !hasStreamedText);

        if (needsFollowUpTurn) {
          // 이번 턴에 실제로 호출된 tool들을 하나의 assistant 메시지로 재구성하고,
          // 각각에 대응하는 tool 결과 메시지를 붙인다 - OpenAI는 한 응답의 tool_calls
          // 전부에 대해 결과가 있어야 다음 턴을 받아준다.
          const calledTools = [extractCall, recommendCall].filter(
            (call): call is NonNullable<typeof call> => Boolean(call),
          );

          const assistantToolCalls: ChatCompletionMessageToolCall[] =
            calledTools.map((call) => ({
              id: call.id,
              type: 'function',
              function: { name: call.name, arguments: call.argsBuffer },
            }));

          const toolResultMessages: ChatCompletionMessageParam[] =
            calledTools.map((call) => {
              const content =
                call.name === 'recommend_plans'
                  ? runPlanRecommendation(plans, mergedKeywords, send)
                  : { ok: true, keywords: mergedKeywords };

              return {
                role: 'tool' as const,
                tool_call_id: call.id,
                content: JSON.stringify(content),
              };
            });

          await streamCompletion({
            messages: [
              ...messages,
              {
                role: 'assistant',
                content: null,
                tool_calls: assistantToolCalls,
              },
              ...toolResultMessages,
            ],
            useTools: false,
            send,
            onStreamCreated: rememberStream,
          });
        }

        // 클라이언트가 다음 요청에 그대로 실어 보낼 수 있게 최신 조건을 알려준다
        // (CHAT-011: 서버는 DB에 저장하지 않고 요청/응답 왕복으로만 들고 있는다).
        send({ event: 'keywords', data: { keywords: mergedKeywords } });
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
