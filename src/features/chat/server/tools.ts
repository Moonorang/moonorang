import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import type { ChatKeywords } from '@/features/chat/types';

/**
 * 사용자 발화에서 조건을 뽑아낼 때 LLM이 호출하는 tool.
 * CARD-013: 자유 입력에서도 조건을 추출해 구조화 형식으로 저장.
 * 언급된 필드만 채워서 온다 - mergeKeywords가 나머지 기존값을 보존한다.
 */
export const EXTRACT_CONDITIONS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'extract_conditions',
    description:
      '사용자 발화에서 요금제 조건(예산, 데이터/테더링 사용량) 또는 관심사·선호를 새로 언급했거나 정정했을 때만 호출한다. 언급 안 된 필드는 아예 넣지 않는다. 조건도 관심사도 전혀 없는 발화면 호출하지 않는다. 숫자(GB, 원)로 직접 말하지 않고 "밖에서 유튜브 보는 정도"처럼 생활 패턴으로만 말해도, 아래 기준을 참고해서 상식적으로 추정한 숫자를 채운다 - 정확한 숫자를 다시 묻지 않는다.',
    parameters: {
      type: 'object',
      properties: {
        budget: { type: 'integer', description: '한 달 예산 상한 (원)' },
        dataUsageGb: {
          type: 'number',
          description:
            '한 달 예상 데이터 사용량(GB). 생활 패턴 표현을 이 기준으로 추정: ' +
            '문자·전화 위주(SNS도 거의 안 함)=3, SNS·카톡 정도=10, ' +
            '밖에서 유튜브·영상·OTT 자주 봄=25, 하루종일 스트리밍·거의 무제한급=100',
        },
        tetheringGb: {
          type: 'number',
          description:
            '한 달 예상 테더링/쉐어링 사용량(GB). 생활 패턴 표현을 이 기준으로 추정: ' +
            '거의 안 함=0, 노트북 가끔 잠깐=10, 자주 씀=30, 거의 매일 씀=60',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description:
            '사용자가 대화 중 드러낸 관심사·취미·선호 키워드를 짧은 명사로 배열에 담는다 ' +
            '(예: "넷플릭스", "유튜브", "게임", "여행", "카페", "육아", "반려동물"). ' +
            '이미 파악된 조건에 없는, 이번 발화에서 새로 나온 키워드만 담는다 - 이미 아는 ' +
            '것을 다시 넣지 않는다.',
        },
      },
      additionalProperties: false,
    },
  },
};

/**
 * 사용자에게 요금제를 추천할 시점을 알리는 tool. 인자는 없다 -
 * CARD-001: 어떤 요금제를 몇 위로 추천할지는 서버가 지금까지 파악된 조건으로 직접 계산하며,
 * 이 tool은 "지금 추천해달라"는 의도 신호로만 쓴다.
 */
export const RECOMMEND_PLANS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'recommend_plans',
    description:
      '사용자가 이번 대화에서 직접 말해준 조건(예산, 예상 데이터/테더링 사용량)을 기준으로 ' +
      '요금제 추천을 원할 때 호출한다. 실제 추천 요금제·순위는 서버가 계산하므로 인자는 없다. ' +
      '조건을 아직 잘 모르겠으면 호출하지 말고 먼저 물어본다. "내 실제 이용 데이터/사용 패턴에 ' +
      '맞춰서" 추천해달라는 뜻이면(로그인 사용자의 실제 사용 이력 기반) 이 tool이 아니라 ' +
      'analyze_savings를 호출한다 - 둘은 근거 데이터가 다르다.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
};

/**
 * CARD-022~028: 로그인 사용자가 "절약해줘"/"나한테 맞는 요금제 추천해줘"처럼 현재 요금제·
 * 실사용 데이터 기준 상담을 원할 때. 사용량 분석 카드 + 3개월 추세를 함께 보낸다.
 * 인자는 없다 - 실제 판단은 서버 계산.
 */
export const ANALYZE_SAVINGS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze_savings',
    description:
      '사용자가 로그인 상태에서 "내 요금제 절약해줘", "돈 아낄 수 있는 방법 알려줘", ' +
      '"나에게 맞는 요금제 추천해줘", "나한테 맞춰서 추천해줘"처럼 - 이번 대화에서 직접 말한 ' +
      '조건이 아니라 본인의 실제 최근 3개월 데이터 사용 이력을 기준으로 한 상담(절약 또는 ' +
      '데이터 부족 시 상향)을 원할 때 호출한다. 실제 판단은 서버가 계산하므로 인자는 없다.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

/**
 * CARD-024/028: "내 데이터 사용량 추세 알려줘"처럼 절약 판단 없이 추세만 보고 싶을 때.
 * analyze_savings와 달리 대안 요금제 판단은 하지 않고 3개월 추세 차트만 보낸다.
 */
export const SHOW_USAGE_TREND_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'show_usage_trend',
    description:
      '사용자가 절약 여부 판단 없이 "내 데이터 사용량 추세 알려줘"처럼 최근 3개월 사용량 ' +
      '자체만 보고 싶어할 때 호출한다. analyze_savings와 달리 대안 요금제는 추천하지 않는다.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

/**
 * CARD-027~028: "부가서비스 추천해줘", "관심사에 맞는 부가서비스 있나요?"처럼 부가서비스
 * 추천을 원할 때. 어떤 부가서비스를 몇 위로 보여줄지는 서버(selectAddOns.ts)가 관심사와
 * 채택률(user_add_ons 실 데이터)로 계산하므로 인자는 없다.
 */
export const RECOMMEND_ADD_ONS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'recommend_addons',
    description:
      '사용자가 "부가서비스 추천해줘", "관심사에 맞는 부가서비스 있나요?", ' +
      '"어떤 부가서비스가 좋을까요?"처럼 부가서비스(요금제에 얹어 쓰는 서비스, 예: ' +
      '번호도용 문자차단·스팸 안심 차단 등) 추천을 원할 때 호출한다. 이번 발화에 관심사가 ' +
      '있으면 그 관심사에 맞는 부가서비스를, 없으면 다른 고객이 많이 쓰는 인기 부가서비스를 ' +
      '서버가 찾아 보여준다. 요금제(recommend_plans) 추천과는 다른 도구다 - 혼동하지 말 것.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

export const CHAT_TOOLS: ChatCompletionTool[] = [
  EXTRACT_CONDITIONS_TOOL,
  RECOMMEND_PLANS_TOOL,
  ANALYZE_SAVINGS_TOOL,
  SHOW_USAGE_TREND_TOOL,
  RECOMMEND_ADD_ONS_TOOL,
];

// extract_conditions를 뺀 "실행" 도구만. 1턴에서 extract_conditions만 부르고 실행 도구를
// 빠뜨린 채 텍스트로 예고만 하는 경우의 보정 턴에서 쓴다(chatStream.ts) - extract_conditions는
// 이미 끝났으니 다시 후보로 줄 필요가 없다.
export const ACTION_TOOLS: ChatCompletionTool[] = [
  RECOMMEND_PLANS_TOOL,
  ANALYZE_SAVINGS_TOOL,
  SHOW_USAGE_TREND_TOOL,
  RECOMMEND_ADD_ONS_TOOL,
];

// extract_conditions tool call의 JSON 문자열을 파싱한다.
// 모델이 스키마를 안 지킨 값(잘못된 타입 등)을 보낼 수도 있어서 필드별로 타입을 검증하고,
// 통과 못 한 필드는 조용히 제외한다(CARD-014) - 그 필드만 이번 턴에 안 갱신될 뿐,
// 대화 자체가 끊기면 안 되므로 전체 실패로 처리하지 않는다.
// 유효한 필드가 하나도 없으면 null.
export function parseExtractConditionsArguments(
  rawArguments: string,
): ChatKeywords | null {
  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
    const result: ChatKeywords = {};

    if (typeof parsed.budget === 'number') result.budget = parsed.budget;
    if (typeof parsed.dataUsageGb === 'number')
      result.dataUsageGb = parsed.dataUsageGb;
    if (typeof parsed.tetheringGb === 'number')
      result.tetheringGb = parsed.tetheringGb;

    if (Array.isArray(parsed.interests)) {
      const interests = parsed.interests
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      if (interests.length > 0) result.interests = interests;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}
