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
import { runSavingsAnalysis } from '@/features/chat/server/analyzeSavings';
import { streamCompletion, type ToolCallBuilder } from '@/features/chat/server/openaiStream';
import { runPlanRecommendation } from '@/features/chat/server/recommendPlans';
import { buildSystemPrompt } from '@/features/chat/server/systemPrompt';
import { parseExtractConditionsArguments } from '@/features/chat/server/tools';
import type { ChatKeywords } from '@/features/chat/types';

import type { Plan } from '@/entities/plan/types';

interface ToolResultContext {
  plans: Plan[];
  mergedKeywords: ChatKeywords;
  userId: string | null;
  send: SSESend;
}

// 호출된 tool 이름별로 실제 계산/조회를 수행하고, 다음 턴의 tool 결과 메시지 content로
// 쓸 값을 돌려준다. recommend_plans/analyze_savings/show_usage_trend는 여기서 SSE
// 이벤트도 같이 내보낸다(카드 데이터를 텍스트보다 먼저 화면에 꽂아 넣기 위함).
async function getToolResultContent(
  call: ToolCallBuilder,
  { plans, mergedKeywords, userId, send }: ToolResultContext,
): Promise<unknown> {
  switch (call.name) {
    case 'recommend_plans':
      return runPlanRecommendation(plans, mergedKeywords, send);
    case 'analyze_savings':
      return runSavingsAnalysis({
        userId,
        allPlans: plans,
        send,
        includeSavingsDecision: true,
      });
    case 'show_usage_trend':
      return runSavingsAnalysis({
        userId,
        allPlans: plans,
        send,
        includeSavingsDecision: false,
      });
    default:
      return { ok: true, keywords: mergedKeywords };
  }
}

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
  summary?: string,
  /** CARD-023: 절약 상담은 로그인 사용자 전용 - route.ts가 미리 확인해서 넘겨준다 */
  userId: string | null = null,
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
          {
            role: 'system',
            content: buildSystemPrompt(plans, incomingKeywords, summary),
          },
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
        const analyzeSavingsCall = toolCalls.find(
          (call) => call.name === 'analyze_savings',
        );
        const showUsageTrendCall = toolCalls.find(
          (call) => call.name === 'show_usage_trend',
        );

        const mergedKeywords = extractCall
          ? mergeKeywords(
              incomingKeywords,
              parseExtractConditionsArguments(extractCall.argsBuffer),
            )
          : incomingKeywords;

        // recommend_plans/analyze_savings/show_usage_trend는 전부 확정된 결과를
        // 설명할 2턴이 필요하고, 그게 아니어도 1턴이 텍스트 없이 tool만 부르고
        // 끝났으면 빈 말풍선을 막기 위해 2턴을 돌린다.
        const needsFollowUpTurn =
          Boolean(recommendCall) ||
          Boolean(analyzeSavingsCall) ||
          Boolean(showUsageTrendCall) ||
          (Boolean(extractCall) && !hasStreamedText);

        if (needsFollowUpTurn) {
          // 이번 턴에 실제로 호출된 tool들을 하나의 assistant 메시지로 재구성하고,
          // 각각에 대응하는 tool 결과 메시지를 붙인다 - OpenAI는 한 응답의 tool_calls
          // 전부에 대해 결과가 있어야 다음 턴을 받아준다.
          const calledTools = [
            extractCall,
            recommendCall,
            analyzeSavingsCall,
            showUsageTrendCall,
          ].filter((call): call is NonNullable<typeof call> => Boolean(call));

          const assistantToolCalls: ChatCompletionMessageToolCall[] =
            calledTools.map((call) => ({
              id: call.id,
              type: 'function',
              function: { name: call.name, arguments: call.argsBuffer },
            }));

          const toolResultMessages: ChatCompletionMessageParam[] =
            await Promise.all(
              calledTools.map(async (call) => ({
                role: 'tool' as const,
                tool_call_id: call.id,
                content: JSON.stringify(
                  await getToolResultContent(call, {
                    plans,
                    mergedKeywords,
                    userId,
                    send,
                  }),
                ),
              })),
            );

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
