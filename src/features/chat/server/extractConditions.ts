import {
  openai,
  OPENAI_MODEL,
  OPENAI_SEED,
  OPENAI_TEMPERATURE,
} from '@/shared/lib/openai';
import {
  EXTRACT_CONDITIONS_TOOL,
  parseExtractConditionsArguments,
} from '@/features/chat/server/tools';
import type { ChatKeywords } from '@/features/chat/types';

// 조건 추출만 하는 짧은 호출이라 대화용 타임아웃(60초)보다 짧게 잡는다.
// 실패해도 대화는 이어져야 하므로 오래 붙잡고 있을 이유가 없다.
const EXTRACT_TIMEOUT_MS = 15_000;

const EXTRACT_SYSTEM_PROMPT = `너는 통신 요금제 상담 대화에서 조건만 뽑아내는 추출기다.
사용자 발화에 예산(원), 데이터 사용량(GB), 테더링/쉐어링 사용량(GB)이 있으면 그 값만 채운다.
- "5만원" -> budget: 50000, "3만원대" -> budget: 30000
- "30기가", "30GB" -> dataUsageGb: 30
- 언급이 없는 필드는 넣지 않는다. 값을 지어내거나 추측하지 않는다.
- 조건이 하나도 없으면 빈 객체를 넘긴다.`;

/**
 * 사용자 발화에서 요금제 조건을 뽑아낸다 (CARD-013).
 *
 * 대화 응답과 같은 호출에 얹지 않고 따로 부르는 이유가 있다. 모델이 되물을 때는
 * (예: "5만원 요금제 추천해줘" -> "데이터 사용량은요?") 텍스트만 내보내고 tool 을
 * 호출하지 않아서, 방금 들은 조건이 그대로 사라진다. gpt-4o 도 마찬가지다.
 * 그래서 tool_choice 로 추출을 강제하는 전용 호출로 분리했다.
 *
 * 실패하면 null - 조건 하나 못 뽑았다고 대화 자체가 끊기면 안 된다(CARD-014).
 */
export async function extractConditions(
  message: string,
): Promise<ChatKeywords | null> {
  try {
    const completion = await openai.chat.completions.create(
      {
        model: OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        seed: OPENAI_SEED,
        tools: [EXTRACT_CONDITIONS_TOOL],
        // 모델의 판단에 맡기지 않고 반드시 이 tool 을 부르게 한다
        tool_choice: {
          type: 'function',
          function: { name: 'extract_conditions' },
        },
        messages: [
          { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
      },
      { timeout: EXTRACT_TIMEOUT_MS },
    );

    const call = completion.choices[0]?.message.tool_calls?.[0];
    if (!call || call.type !== 'function') return null;

    return parseExtractConditionsArguments(call.function.arguments);
  } catch (error) {
    // 추출 실패는 대화를 막지 않는다 - 이번 턴의 조건만 못 기록될 뿐이다
    console.error('[api/chat] 조건 추출 실패:', error);
    return null;
  }
}
