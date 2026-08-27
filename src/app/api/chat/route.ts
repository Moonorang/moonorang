import { APIConnectionTimeoutError, APIError } from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { openai, OPENAI_MODEL } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/chatSystemPrompt';
import { CHAT_TOOLS, parseRecommendPlansArguments } from '@/lib/chatTools';
import { getAllPlans, getPlansByIds } from '@/lib/plans';
import type {
  ChatRequestBody,
  ChatStreamEvent,
  PlanRecommendation,
} from '@/types/chat';

// 응답 대기는 최대 60초로 제한
const REQUEST_TIMEOUT_MS = 60_000;

function formatSSE(event: ChatStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

// 스트리밍 중 조각으로 오는 tool_calls 델타를 index 기준으로 누적
interface ToolCallBuilder {
  id: string;
  name: string;
  argsBuffer: string;
}

// 한 번은 OpenAI 스트리밍 호출 실행
// 텍스트 조각은 token 이벤트로 흘려보내기
// tool_calls는 다 모아서 반환
async function streamCompletion({
  messages,
  useTools,
  controller,
  encoder,
  onStreamCreated,
}: {
  messages: ChatCompletionMessageParam[];
  useTools: boolean;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  onStreamCreated: (stream: Stream<ChatCompletionChunk>) => void;
}): Promise<{ toolCalls: ToolCallBuilder[]; finishReason: string | null }> {
  const stream = await openai.chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages,
      stream: true,
      ...(useTools ? { tools: CHAT_TOOLS } : {}),
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );
  onStreamCreated(stream);

  const toolCallBuilders = new Map<number, ToolCallBuilder>();
  let finishReason: string | null = null;

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;

    if (choice.delta.content) {
      controller.enqueue(
        encoder.encode(
          formatSSE({ event: 'token', data: { delta: choice.delta.content } }),
        ),
      );
    }

    for (const toolCallDelta of choice.delta.tool_calls ?? []) {
      const existing = toolCallBuilders.get(toolCallDelta.index);
      if (existing) {
        existing.argsBuffer += toolCallDelta.function?.arguments ?? '';
      } else {
        toolCallBuilders.set(toolCallDelta.index, {
          id: toolCallDelta.id ?? '',
          name: toolCallDelta.function?.name ?? '',
          argsBuffer: toolCallDelta.function?.arguments ?? '',
        });
      }
    }

    if (choice.finish_reason) finishReason = choice.finish_reason;
  }

  return { toolCalls: [...toolCallBuilders.values()], finishReason };
}

// recommend_plans tool call 결과를 조립해서 recommendation 이벤트로 내보냄
// 다음 턴에 넣을 tool 결과 메시지도 같이 돌려줌
async function handleRecommendPlansCall(
  toolCall: ToolCallBuilder,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
): Promise<ChatCompletionMessageParam[] | null> {
  const input = parseRecommendPlansArguments(toolCall.argsBuffer);

  if (!input) {
    controller.enqueue(
      encoder.encode(
        formatSSE({
          event: 'error',
          data: {
            reason: 'invalid_format',
            message: '추천 결과 형식이 올바르지 않습니다.',
          },
        }),
      ),
    );
    return null;
  }

  const planIds = input.recommendations.map((item) => item.planId);
  const plans = await getPlansByIds(planIds);
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));

  const recommendations: PlanRecommendation[] = input.recommendations
    .map((item) => {
      const plan = plansById.get(item.planId);
      if (!plan) return null; // 모델이 목록에 없는 id를 지어낸 경우 - 조용히 제외
      return { plan, rank: item.rank, reason: item.reason };
    })
    .filter((item): item is PlanRecommendation => item !== null);

  controller.enqueue(
    encoder.encode(
      formatSSE({
        event: 'recommendation',
        data: { plans: recommendations },
      }),
    ),
  );

  // 다음 턴에서 모델이 자연어로 마무리 발언을 할 때 참고할 사실 - 실제 DB 값만 담는다.
  const toolResultSummary = recommendations.map((item) => ({
    rank: item.rank,
    name: item.plan.name,
    monthlyFee: item.plan.monthlyFee,
  }));

  return [
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: toolCall.id,
          type: 'function',
          function: { name: toolCall.name, arguments: toolCall.argsBuffer },
        },
      ],
    },
    {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResultSummary),
    },
  ];
}

// /api/chat-SSE 스트리밍 + tool calling
/* 1턴: 시스템 프롬프트 + 사용자 메시지로 호출
텍스트는 바로 token 이벤트로 흘려보내고, recommend_plans 를 호출했으면 tool_calls 를 모아둠
2턴: tool_calls 가 있었으면, 조회 결과(recommendation 이벤트 전송 후)를 tool 메시지로
 *      넣고 다시 호출해서 자연어 마무리 응답을 스트리밍한다. tool_calls 가 없었으면 1턴으로 끝
*/
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
  // 클라이언트가 연결을 끊었을 때(페이지 이동 등) cancel() 에서 현재 진행 중인 스트림을 정리
  let activeStream: Stream<ChatCompletionChunk> | null = null;

  const body = new ReadableStream({
    async start(controller) {
      try {
        const plans = await getAllPlans();
        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: buildSystemPrompt(plans) },
          { role: 'user', content: message },
        ];

        const firstTurn = await streamCompletion({
          messages,
          useTools: true,
          controller,
          encoder,
          onStreamCreated: (stream) => {
            activeStream = stream;
          },
        });

        const recommendCall = firstTurn.toolCalls.find(
          (call) => call.name === 'recommend_plans',
        );

        if (recommendCall) {
          const followUpMessages = await handleRecommendPlansCall(
            recommendCall,
            controller,
            encoder,
          );

          if (followUpMessages) {
            await streamCompletion({
              messages: [...messages, ...followUpMessages],
              useTools: false,
              controller,
              encoder,
              onStreamCreated: (stream) => {
                activeStream = stream;
              },
            });
          }
        }

        controller.enqueue(
          encoder.encode(formatSSE({ event: 'done', data: {} })),
        );
      } catch (error) {
        // 사유를 구분해서 안내
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
