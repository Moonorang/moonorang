import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import type { PlanRecommendationScope } from '@/features/chat/lib/selectPlans';
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
        priority: {
          type: 'string',
          enum: ['priciest', 'cheapest', 'data', 'balanced'],
          description:
            '예산과 데이터 중 뭘 우선할지의 상대적 선호. **규칙: 이번 발화에서 예산은 ' +
            '알게 됐는데(이번 발화든 이전 턴이든) 데이터 사용량은 숫자로도 생활 ' +
            '패턴으로도 전혀 모르면, 항상 "priciest"를 채운다** - "요금제 추천해줘 월 ' +
            '5만원대로", "5만원 정도로 뭐 있어?"처럼 데이터 언급이 아예 없는 짧은 ' +
            '요청이 전형적인 예다. 이 경우를 놓치고 필드를 안 채우면, 서버가 데이터 ' +
            '사용량을 임의의 기본값(15GB)으로 가정해버려서 예산과 무관하게 늘 저가 ' +
            '요금제만 추천된다. "priciest": 위 규칙 외에도 "제일 비싼 걸로", "가장 ' +
            '혜택 큰 걸로"처럼 명시적으로 말했을 때도 채운다. "cheapest": "제일 싼 ' +
            '걸로", "가장 저렴한 걸로", "가성비로"처럼 반대로 가장 저렴한 쪽을 원할 ' +
            '때. "data": "이전 추천보다 데이터 더 많이", "데이터 넉넉하게", ' +
            '"무제한으로" 처럼 dataUsageGb를 구체적 숫자로 못 박기보다 예산 안에서 ' +
            '데이터가 가장 많은 쪽을 원할 때 - dataUsageGb를 억지로 큰 숫자로 ' +
            '추정해서 흉내 내지 않는다(그 숫자 하나에 따라 결과가 들쭉날쭉해진다). ' +
            '"balanced": 사용자가 다시 "적당한/무난한 걸로"처럼 어느 한쪽 우선도 그만 ' +
            '원하면 명시해서 되돌린다(언급이 없으면 이전 값이 그대로 유지되므로, ' +
            '되돌릴 때는 반드시 이 필드를 balanced로 채워야 한다). budget·dataUsageGb를 ' +
            '둘 다 숫자로 알고 있어서 균형 있게 추천받고 싶으면 이 필드 자체를 넣지 ' +
            '않는다(기본값 유지).',
        },
        resultCount: {
          type: 'integer',
          description:
            '사용자가 명시적으로 말한 추천 개수. "1개만", "하나만 추천해줘", "딱 ' +
            '하나만"처럼 개수를 콕 집어 말했을 때만 채운다(1~3 사이 값만 의미가 ' +
            '있다 - 그 범위를 벗어나면 서버가 안쪽으로 clamp한다). 언급이 없으면 ' +
            '이 필드 자체를 넣지 않는다(기본값 3개 유지, 이전 턴에 이미 채워져 ' +
            '있었다면 그 값이 그대로 유지된다) - 다시 여러 개를 보고 싶다고 하면 ' +
            '3처럼 새 숫자를 명시해서 채운다.',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description:
            '사용자가 대화 중 드러낸 관심사·취미·선호 키워드를 짧은 명사로 배열에 담는다 ' +
            '(예: "넷플릭스", "유튜브", "게임", "여행", "카페", "육아", "반려동물"). ' +
            '"OTT", "스트리밍", "음악"처럼 구체적인 브랜드명이 아니라 카테고리·장르로만 ' +
            '말해도 마찬가지로 담는다 - 구체적이지 않다고 빼먹지 않는다. 이미 파악된 ' +
            '조건에 없는, 이번 발화에서 새로 나온 키워드만 담는다 - 이미 아는 것을 다시 ' +
            '넣지 않는다.',
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
      '요금제 추천을 원할 때 호출한다. 실제 추천 요금제·순위는 서버가 계산한다. ' +
      '조건을 아직 잘 모르겠으면 호출하지 말고 먼저 물어본다. "내 실제 이용 데이터/사용 패턴에 ' +
      '맞춰서" 추천해달라는 뜻이면(로그인 사용자의 실제 사용 이력 기반) 이 tool이 아니라 ' +
      'analyze_savings를 호출한다 - 둘은 근거 데이터가 다르다.',
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['recommended', 'catalog', 'alternative'],
          description:
            '평소의 "지금까지 파악된 조건으로 추천" 요청이면 이 필드 자체를 넣지 않는다. ' +
            '아래 세 경우에만 채운다. "recommended": "그중에 제일 비싼/싼 거", "추천해준 ' +
            '것 중에서"처럼 방금 추천한 요금제들 범위 안에서만 다시 고를 때. "catalog": ' +
            '"요금제 전체에서 제일 비싼/싼 거", "모든 요금제 중에"처럼 지금까지 파악된 ' +
            '예산·데이터 조건과 무관하게 카탈로그 전체를 통틀어 찾을 때. "alternative": ' +
            '"~하나만 더", "방금 추천해준 거랑 가장 비슷한 다른 요금제"처럼 이미 보여준 ' +
            '것과는 다른, 원래 조건에 그다음으로 잘 맞는 요금제를 새로 찾을 때. ' +
            '**recommended/catalog 판단이 애매하면(범위를 가리키는 말이 전혀 없이 그냥 ' +
            '"제일 비싼 요금제 골라봐"처럼만 말하면) 이 tool을 호출하지 말고 먼저 어느 ' +
            '쪽인지 사용자에게 되물어야 한다** - 시스템 프롬프트의 해당 규칙을 참고할 것.',
        },
        direction: {
          type: 'string',
          enum: ['priciest', 'cheapest'],
          description:
            'scope가 "recommended" 또는 "catalog"일 때 **반드시 이번 발화 기준으로 ' +
            '직접 채운다** - "제일 비싼"이면 "priciest", "제일 싼/저렴한"이면 "cheapest". ' +
            '이전 턴에 extract_conditions로 채워둔 priority가 남아있어도 이 필드로 ' +
            '넘긴 값을 우선 쓴다 - "이번엔 반대로 싼 걸로"처럼 방향이 바뀌었는데 이 ' +
            '필드를 안 채우거나 이전 방향 그대로 채우면, 서버가 예전 방향으로 계산한 ' +
            '결과를 돌려주는데 그걸 반대 방향이라고 잘못 설명하게 된다. scope가 ' +
            '"alternative"이거나 아예 없으면(평소 추천) 이 필드는 넣지 않는다.',
        },
      },
      additionalProperties: false,
    },
  },
};

export interface RecommendPlansArguments {
  scope?: PlanRecommendationScope;
  direction?: 'priciest' | 'cheapest';
}

// recommend_plans tool call의 JSON 문자열에서 scope·direction을 뽑아낸다. 스키마를
// 안 지킨 값이 와도(오타·다른 문자열 등) 조용히 무시하고 undefined로 처리해서 평소
// 추천으로 넘어간다(CARD-014와 같은 원칙 - 파싱 실패로 대화가 끊기면 안 된다).
export function parseRecommendPlansArguments(
  rawArguments: string,
): RecommendPlansArguments {
  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
    const result: RecommendPlansArguments = {};

    if (
      parsed.scope === 'recommended' ||
      parsed.scope === 'catalog' ||
      parsed.scope === 'alternative'
    ) {
      result.scope = parsed.scope;
    }
    if (parsed.direction === 'priciest' || parsed.direction === 'cheapest') {
      result.direction = parsed.direction;
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * CARD-029: 사용자가 특정 요금제·부가서비스·구독 상품을 콕 집어 "가입할래"라고
 * 말했을 때, 그 상품의 가입 절차 카드를 연다. kind·itemId는 시스템 프롬프트에
 * 이미 준 카탈로그 목록에서 고르므로(NFR-003~004와 같은 원칙 - 이름·가격을 직접
 * 만들어내지 않는다), 서버가 실제로 그 id가 존재하는지 다시 확인한 뒤에만 카드를
 * 연다. 추천(recommend_plans 등)과는 다르다 - "어떤 게 좋을지 골라달라"가 아니라
 * "이미 정했다"는 뜻일 때만 쓴다.
 */
export const START_JOIN_FLOW_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'start_join_flow',
    description:
      '사용자가 "너겟39 가입할래", "그 부가서비스 신청할래", "이 구독 상품 가입하고 ' +
      '싶어"처럼 카탈로그에 있는 특정 상품을 콕 집어 가입 의사를 밝혔을 때 호출한다. ' +
      '위 "현재 보유한 요금제/부가서비스/구독 상품 목록"에서 사용자가 말한 이름과 ' +
      '가장 가깝게 일치하는 항목 하나를 골라 그 id를 itemId로 채운다. ' +
      '**사용자가 말한 이름이 목록의 여러 항목과 헷갈리거나(예: 번호를 안 붙이고 ' +
      '"너겟"이라고만 말함), 어떤 상품인지 확신이 안 서면 호출하지 말고 어떤 상품인지 ' +
      '먼저 되물어라.** "요금제 추천해줘"처럼 아직 뭘 고를지 정하지 않은 요청에는 이 ' +
      'tool이 아니라 recommend_plans 등을 쓴다 - 이 tool은 사용자가 이미 특정 상품을 ' +
      '정했을 때만 쓴다.',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['plan', 'addOn', 'subscription'],
          description:
            '가입하려는 상품 종류 - 요금제/부가서비스/구독 상품 중 하나.',
        },
        itemId: {
          type: 'integer',
          description:
            '위 카탈로그 목록에 있는 그 상품의 실제 id. 목록에 없는 번호를 지어내지 않는다.',
        },
      },
      required: ['kind', 'itemId'],
      additionalProperties: false,
    },
  },
};

export interface StartJoinFlowArguments {
  kind: 'plan' | 'addOn' | 'subscription';
  itemId: number;
}

// start_join_flow tool call의 JSON 문자열을 파싱한다. 스키마가 안 맞으면 null -
// 호출부(chatStream.ts)가 조용히 실패 결과로 처리한다(CARD-014와 같은 원칙).
export function parseStartJoinFlowArguments(
  rawArguments: string,
): StartJoinFlowArguments | null {
  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
    const kind = parsed.kind;
    const itemId = parsed.itemId;

    if (
      (kind === 'plan' || kind === 'addOn' || kind === 'subscription') &&
      typeof itemId === 'number' &&
      Number.isInteger(itemId)
    ) {
      return { kind, itemId };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * CARD-024: 로그인 사용자가 절약 판단도 3개월 추세도 필요 없이 "지금 내가 무슨 요금제를
 * 쓰고 있는지"만 알고 싶을 때. 최근 3개월 사용 이력이 없어도(가입한 지 얼마 안 된
 * 사용자 등) 동작한다 - analyze_savings/show_usage_trend와 달리 이력 조회 자체를 안
 * 한다. 인자는 없다.
 */
export const SHOW_CURRENT_PLAN_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'show_current_plan',
    description:
      '사용자가 로그인 상태에서 "내 요금제 정보 알려줘", "나 지금 무슨 요금제 써?", ' +
      '"내 요금제 뭐야", "지금 쓰는 요금제 특징이 뭐야"처럼 - 절약/상향 판단이나 3개월 ' +
      '추세 없이 지금 이용 중인 요금제 자체(이름, 특징, 잔여 사용량)만 알고 싶을 때 ' +
      '호출한다. 실제 판단은 서버가 계산하므로 인자는 없다. "절약해줘"/"나에게 맞춰 ' +
      '추천해줘"면 analyze_savings를, "사용량 추세 알려줘"면 show_usage_trend를 대신 ' +
      '호출한다 - 셋은 근거·목적이 다른 별개의 도구다.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
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

/**
 * CARD-027~028: "구독 상품 추천해줘"처럼 구독 상품(넷플릭스+유튜브 프리미엄 묶음 등)
 * 추천을 원할 때. RECOMMEND_ADD_ONS_TOOL과 같은 패턴 - 인자 없이 서버(selectSubscriptions.ts)가
 * 관심사와 채택률(user_subscriptions 실 데이터)로 계산한다.
 */
export const RECOMMEND_SUBSCRIPTIONS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'recommend_subscriptions',
    description:
      '사용자가 "구독 상품 추천해줘", "관심사에 맞는 구독 상품 있나요?", ' +
      '"OTT 구독권 있어요?"처럼 구독 상품(넷플릭스·유튜브 프리미엄 묶음 등 매달 결제하는 ' +
      '상품) 추천을 원할 때 호출한다. 이번 발화에 관심사가 있으면 그 관심사에 맞는 구독 ' +
      '상품을, 없으면 다른 고객이 많이 쓰는 인기 구독 상품을 서버가 찾아 보여준다. ' +
      '부가서비스(recommend_addons)·요금제(recommend_plans) 추천과는 다른 도구다.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

/**
 * CARD-028: "내 주변에 멤버십 쓸 데 있어?"처럼 주변 제휴처를 찾을 때. 인자는 없다 -
 * 브랜드 목록(membership_brands)과 사용자 위치(요청 바디의 location, LLM이 채우는 값이
 * 아니다)로 서버(findNearbyMemberships.ts)가 카카오 로컬 API를 호출해 계산한다.
 */
export const FIND_NEARBY_MEMBERSHIPS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'find_nearby_memberships',
    description:
      '사용자가 "내 주변에 멤버십 쓸 데 있어?", "근처에 혜택 받을 수 있는 곳 있나요?"처럼 ' +
      '현재 위치 기준으로 가까운 멤버십 제휴처를 찾아달라고 할 때 호출한다 (인자 없음). ' +
      '실제 검색은 서버가 카카오 지도로 계산하므로 지점명·거리를 직접 말하지 않는다.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

export const CHAT_TOOLS: ChatCompletionTool[] = [
  EXTRACT_CONDITIONS_TOOL,
  RECOMMEND_PLANS_TOOL,
  START_JOIN_FLOW_TOOL,
  SHOW_CURRENT_PLAN_TOOL,
  ANALYZE_SAVINGS_TOOL,
  SHOW_USAGE_TREND_TOOL,
  RECOMMEND_ADD_ONS_TOOL,
  RECOMMEND_SUBSCRIPTIONS_TOOL,
  FIND_NEARBY_MEMBERSHIPS_TOOL,
];

// extract_conditions를 뺀 "실행" 도구만. 1턴에서 extract_conditions만 부르고 실행 도구를
// 빠뜨린 채 텍스트로 예고만 하는 경우의 보정 턴에서 쓴다(chatStream.ts) - extract_conditions는
// 이미 끝났으니 다시 후보로 줄 필요가 없다.
export const ACTION_TOOLS: ChatCompletionTool[] = [
  RECOMMEND_PLANS_TOOL,
  START_JOIN_FLOW_TOOL,
  SHOW_CURRENT_PLAN_TOOL,
  ANALYZE_SAVINGS_TOOL,
  SHOW_USAGE_TREND_TOOL,
  RECOMMEND_ADD_ONS_TOOL,
  RECOMMEND_SUBSCRIPTIONS_TOOL,
  FIND_NEARBY_MEMBERSHIPS_TOOL,
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
    if (
      parsed.priority === 'priciest' ||
      parsed.priority === 'cheapest' ||
      parsed.priority === 'data'
    ) {
      result.priority = parsed.priority;
    } else if (parsed.priority === 'balanced') {
      // 이전에 채워둔 priority를 명시적으로 되돌린다 - undefined도 own property로
      // 잡혀서(Object.keys에 포함) mergeKeywords의 스프레드가 이전 값을 지운다.
      result.priority = undefined;
    }
    if (
      typeof parsed.resultCount === 'number' &&
      Number.isInteger(parsed.resultCount)
    ) {
      result.resultCount = parsed.resultCount;
    }

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
