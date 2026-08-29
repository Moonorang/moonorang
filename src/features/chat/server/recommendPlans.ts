import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { getPlansByIds } from '@/entities/plan/server/planRepository';
import type { SSESend } from '@/features/chat/lib/sse';
import type { ToolCallBuilder } from '@/features/chat/server/openaiStream';
import { parseRecommendPlansArguments } from '@/features/chat/server/tools';
import type { PlanRecommendation } from '@/features/chat/types';

/**
 * recommend_plans tool call 을 실제 추천 결과로 바꾼다.
 *
 * CARD-001~002 / NFR-003~004: 모델은 planId·순위·이유만 주고,
 * 화면에 보이는 요금제명·가격·데이터량은 여기서 DB 조회로 채운다.
 *
 * recommendation 이벤트를 내보내고, 다음 턴에 넣을 tool 결과 메시지를 돌려준다.
 * 파싱에 실패하면 error 이벤트를 내보내고 null (CARD-005 invalid_format).
 */
export async function handleRecommendPlansCall(
  toolCall: ToolCallBuilder,
  send: SSESend,
): Promise<ChatCompletionMessageParam[] | null> {
  const input = parseRecommendPlansArguments(toolCall.argsBuffer);

  if (!input) {
    send({
      event: 'error',
      data: {
        reason: 'invalid_format',
        message: '추천 결과 형식이 올바르지 않습니다.',
      },
    });

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

  send({ event: 'recommendation', data: { plans: recommendations } });

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
