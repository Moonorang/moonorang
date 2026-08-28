import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import type { RecommendPlansToolInput } from '@/features/chat/types';

// LLM이 요금제를 추천할 때 호출하는 tool
export const RECOMMEND_PLANS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'recommend_plans',
    description:
      '사용자에게 요금제를 추천할 때 호출한다. 요금제명·가격 등 실제 데이터는 시스템이 DB에서 채워 넣으므로, 여기서는 어떤 요금제(id)를 몇 위로 왜 추천하는지만 전달한다. 조건에 맞는 요금제가 없으면 이 도구를 호출하지 말고 텍스트로 안내한다.',
    parameters: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          description: '추천 요금제 목록 (보통 1~3개)',
          items: {
            type: 'object',
            properties: {
              planId: { type: 'integer', description: '추천할 요금제의 id' },
              rank: { type: 'integer', description: '추천 순위, 1부터 시작' },
              reason: {
                type: 'string',
                description: '이 요금제를 추천하는 이유 (한국어, 1~2문장)',
              },
            },
            required: ['planId', 'rank', 'reason'],
            additionalProperties: false,
          },
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    },
  },
};

export const CHAT_TOOLS: ChatCompletionTool[] = [RECOMMEND_PLANS_TOOL];

// recommend_plans tool call의 JSON 문자열을 파싱
// 모델이 스키마를 안 지킨 값을 보낼 수도 있어서, 최소한의 모양 검증까지 함
// 실패하면 null - 호출부에서 invalid_format 에러로 처리
export function parseRecommendPlansArguments(
  rawArguments: string,
): RecommendPlansToolInput | null {
  try {
    const parsed = JSON.parse(rawArguments);

    if (!Array.isArray(parsed?.recommendations)) return null;

    const recommendations = parsed.recommendations.filter(
      (
        item: unknown,
      ): item is RecommendPlansToolInput['recommendations'][number] =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { planId?: unknown }).planId === 'number' &&
        typeof (item as { rank?: unknown }).rank === 'number' &&
        typeof (item as { reason?: unknown }).reason === 'string',
    );

    if (recommendations.length === 0) return null;

    return { recommendations };
  } catch {
    return null;
  }
}
