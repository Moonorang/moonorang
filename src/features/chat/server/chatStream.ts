import { APIConnectionTimeoutError, APIError } from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { getAllPlans } from '@/entities/plan/server/planRepository';
import { mergeKeywords } from '@/features/chat/lib/mergeKeywords';
import { createSSESender, type SSESend } from '@/features/chat/lib/sse';
import { extractConditions } from '@/features/chat/server/extractConditions';
import { streamCompletion } from '@/features/chat/server/openaiStream';
import { runPlanRecommendation } from '@/features/chat/server/recommendPlans';
import { buildSystemPrompt } from '@/features/chat/server/systemPrompt';
import { RECOMMEND_PLANS_TOOL } from '@/features/chat/server/tools';
import type { ChatKeywords, PlanRecommendation } from '@/features/chat/types';

/**
 * 한 번의 상담 요청을 SSE 스트림으로 만든다.
 *
 * 0단계: 이번 발화의 조건을 전용 호출로 먼저 추출한다(extractConditions).
 *        대화 호출에 얹지 않는 이유는 그 함수 주석에 적어뒀다.
 * 1턴: 시스템 프롬프트(+ 방금 추출한 조건까지 반영) + 사용자 메시지로 호출.
 *      텍스트는 곧바로 token 이벤트로 흘려보내고, 추천 의도는
 *      recommend_plans(트리거)로 받는다.
 * 2턴: tool 이 하나라도 호출됐으면 - 그 결과를 tool 메시지로 넣어 다시 호출해
 *      자연어 마무리 응답을 스트리밍한다.
 *      tool 이 하나도 없었으면(텍스트로만 답한 턴) 1턴으로 끝난다.
 *
 * 이벤트 순서는 token(설명) -> recommendation(카드) -> keywords -> done 이다.
 * 추천 순위는 2턴의 tool 결과로 필요해서 미리 계산하지만, 카드가 설명보다 먼저
 * 뜨면 읽기 전에 결론부터 보이므로 이벤트만 붙잡아 뒀다가 설명 뒤에 내보낸다.
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
        // 이번 발화의 조건을 먼저 확정한다. 대화 호출보다 앞서 두는 이유는
        // 시스템 프롬프트의 "지금까지 파악된 조건"에 방금 들은 값까지 담기 위해서다 -
        // 그래야 같은 턴에서 바로 추천으로 넘어갈 수 있고, 이미 말한 걸 되묻지 않는다.
        const [plans, extracted] = await Promise.all([
          getAllPlans(),
          extractConditions(message),
        ]);

        const mergedKeywords = mergeKeywords(incomingKeywords, extracted);

        const messages: ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: buildSystemPrompt(plans, mergedKeywords),
          },
          { role: 'user', content: message },
        ];

        // 조건 추출은 위에서 끝냈으므로 대화 호출에는 추천 tool 만 준다.
        // tool 을 둘 다 주면 모델이 extract_conditions 하나만 부르고
        // recommend_plans 를 빠뜨리는 일이 잦다.
        const toolCalls = await streamCompletion({
          messages,
          tools: [RECOMMEND_PLANS_TOOL],
          send,
          onStreamCreated: rememberStream,
        });

        // tool 을 부른 응답은 finish_reason 이 tool_calls 라 텍스트가 한 글자도 없다.
        // recommend_plans 가 있을 때만 2턴을 돌면, "30기가"처럼 조건만 말해
        // extract_conditions 만 불린 턴은 화면에 아무것도 남지 않는다.
        // 그래서 tool 이 하나라도 불렸으면 항상 2턴을 돌려 자연어 응답을 만든다.
        if (toolCalls.length > 0) {
          // 이번 턴에 실제로 호출된 tool들을 하나의 assistant 메시지로 재구성하고,
          // 각각에 대응하는 tool 결과 메시지를 붙인다 - OpenAI는 한 응답의 tool_calls
          // 전부에 대해 결과가 있어야 다음 턴을 받아준다.
          const calledTools = toolCalls;

          const assistantToolCalls: ChatCompletionMessageToolCall[] =
            calledTools.map((call) => ({
              id: call.id,
              type: 'function',
              function: { name: call.name, arguments: call.argsBuffer },
            }));

          // 추천 카드는 설명보다 먼저 뜨면 안 된다 - 사용자는 왜 이 요금제인지
          // 읽은 다음에 카드를 봐야 한다. 그런데 순위 계산은 다음 턴의 tool 결과로
          // 필요해서 지금 해야 하므로, 계산은 하되 이벤트만 붙잡아 두고
          // 자연어 설명이 끝난 뒤에 내보낸다.
          let heldRecommendations: PlanRecommendation[] | null = null;
          const holdRecommendation: SSESend = (event) => {
            if (event.event === 'recommendation') {
              heldRecommendations = event.data.plans;
              return;
            }

            send(event);
          };

          const toolResultMessages: ChatCompletionMessageParam[] =
            calledTools.map((call) => {
              const content =
                call.name === 'recommend_plans'
                  ? runPlanRecommendation(
                      plans,
                      mergedKeywords,
                      holdRecommendation,
                    )
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
            send,
            onStreamCreated: rememberStream,
          });

          // 설명이 다 나간 뒤에 카드를 띄운다
          if (heldRecommendations) {
            send({
              event: 'recommendation',
              data: { plans: heldRecommendations },
            });
          }
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
