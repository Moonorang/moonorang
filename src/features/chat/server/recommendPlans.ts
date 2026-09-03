import type { Plan } from '@/entities/plan/types';
import {
  pickPriceExtremeFromSet,
  selectPlansAcrossCatalog,
  selectRecommendedPlans,
  type PlanRecommendationScope,
} from '@/features/chat/lib/selectPlans';
import type { SSESend } from '@/features/chat/lib/sse';
import type { ChatKeywords, PlanRecommendation } from '@/features/chat/types';

// scope: 'recommended' | 'catalog' | 'alternative' 는 전부 "딱 하나만 골라줘" 요청이라
// (그중에 제일 비싼 거, 하나만 더 등) 항상 1개만 돌려준다 - 여러 개를 원하면 그때
// 가서 확장한다.
const SCOPED_PICK_COUNT = 1;

// 채점 결과가 왜 그 순위인지 짧게 서술한다. 지금 화면(PlanCard)엔 노출 안 되지만
// PlanRecommendation.reason 계약을 채워두면 나중에 카드에 붙일 때 바로 쓸 수 있다.
// 자세한 설명(혜택 등)은 이 문장이 아니라 이어지는 LLM의 자연어 응답이 맡는다.
function describeFit(isWithinBudget: boolean, usageGb: number): string {
  const budgetNote = isWithinBudget ? '예산 안에서' : '예산을 조금 넘지만';
  return `${budgetNote} 데이터 사용 패턴(약 ${usageGb}GB 기준)에 맞춰 계산한 요금제예요.`;
}

// 예산·데이터 사용량 없이 관심사만으로 찾은 경우(selectPlans.ts의 isInterestBrowse) -
// "예산 안에서" 같은 문구는 적합하지 않아 별도 문장을 쓴다.
function describeInterestMatch(): string {
  return '관심사에 맞는 혜택이 있는 요금제예요.';
}

// priority: 'data'(예: "이전보다 데이터 더 많이") - "약 XGB 기준에 맞춰"라는 문구가
// 안 맞는다. 예산 안에서 데이터가 많은 순으로 골랐다는 걸 그대로 밝힌다.
function describeDataPriorityMatch(isWithinBudget: boolean): string {
  const budgetNote = isWithinBudget ? '예산 안에서' : '예산을 조금 넘지만';
  return `${budgetNote} 데이터 제공량이 가장 많은 순으로 고른 요금제예요.`;
}

// priority: 'priciest'(예: "월 5만원대로 추천해줘" - 데이터 언급 없이 예산만 준
// 경우, 또는 "제일 비싼 걸로") - 예산을 최대한 활용하는(가장 비싼) 순으로 골랐다는
// 걸 그대로 밝힌다.
function describePriciestMatch(): string {
  return '예산 안에서 가장 비싼(혜택이 큰) 순으로 고른 요금제예요.';
}

// priority: 'cheapest'(예: "제일 싼 걸로", "가장 저렴한 걸로") - priciest와
// 정반대로 가장 저렴한 순으로 골랐다는 걸 그대로 밝힌다.
function describeCheapestMatch(): string {
  return '가장 저렴한 순으로 고른 요금제예요.';
}

// scope: 'catalog' - 예산·데이터 조건과 무관하게 카탈로그 전체에서 찾은 극값이라는
// 걸 명확히 밝힌다(그래야 사용자가 "왜 내 예산 조건을 무시했지"라고 헷갈리지 않는다).
function describeCatalogExtreme(direction: 'priciest' | 'cheapest'): string {
  return direction === 'priciest'
    ? '지금까지 말씀해주신 조건과 무관하게, 전체 요금제 중 월 요금이 가장 높은 요금제예요.'
    : '지금까지 말씀해주신 조건과 무관하게, 전체 요금제 중 월 요금이 가장 낮은 요금제예요.';
}

// scope: 'recommended' - 방금 추천했던 요금제들 안에서만 고른 것임을 밝힌다.
function describeRecommendedExtreme(
  direction: 'priciest' | 'cheapest',
): string {
  return direction === 'priciest'
    ? '방금 추천해드린 요금제들 중 월 요금이 가장 높은 요금제예요.'
    : '방금 추천해드린 요금제들 중 월 요금이 가장 낮은 요금제예요.';
}

// scope: 'alternative' - 원래 추천과는 다른, 그다음으로 조건에 잘 맞는 요금제.
function describeAlternativeMatch(): string {
  return '방금 추천해드린 요금제들과는 다른, 같은 조건에 그다음으로 잘 맞는 요금제예요.';
}

/**
 * recommend_plans가 트리거되면(=사용자가 추천을 원하면) 실제 선별을 수행한다.
 *
 * CARD-001~002 / NFR-003~004: LLM은 "지금 추천해달라"는 신호만 주고(recommend_plans),
 * 어떤 요금제를 몇 위로 추천할지는 이 함수(selectRecommendedPlans)가 순수 계산으로 정한다.
 * planId·rank는 LLM 출력이 아니라 서버 계산 결과이므로 존재하지 않는 id를 지어낼 수 없다.
 *
 * recommendation 이벤트를 내보내고, 다음 턴(자연어 마무리 응답)의 tool 결과 메시지에
 * 넣을 요약값을 돌려준다 - 메시지 envelope(assistant/tool role) 조립은 호출부(chatStream)가 한다.
 */
// tool 결과 메시지로 돌려줄 요약 - 실제 DB 값만 담는다(NFR-003/004).
function toResultSummary(recommendations: PlanRecommendation[]) {
  return recommendations.map((item) => ({
    rank: item.rank,
    name: item.plan.name,
    monthlyFee: item.plan.monthlyFee,
    dataAllowance: item.plan.dataAllowance,
    benefits: item.plan.benefits,
  }));
}

export function runPlanRecommendation(
  plans: Plan[],
  keywords: ChatKeywords,
  send: SSESend,
  scope?: PlanRecommendationScope,
  // scope: 'recommended' | 'catalog' 전용. tool call 안에서 이번 발화 기준으로
  // 직접 채워 보내는 값이라 keywords.priority(이전 턴부터 남아있을 수 있는 값)보다
  // 우선한다 - "이번엔 반대로 싼 걸로"처럼 방향이 바뀌었는데 extract_conditions가
  // priority를 안 갱신해도(모델이 놓칠 수 있다, 실측으로 확인됨) 이 값이 있으면
  // 정확한 방향으로 계산된다.
  direction?: 'priciest' | 'cheapest',
): unknown {
  // scope: 'recommended' | 'catalog' - "그중에/전체에서 제일 비싼·싼 거"처럼 범위를
  // 특정한 극값 조회. 평소 추천(아래)과는 완전히 다른 별개의 질의라 여기서 먼저 갈라낸다.
  if (scope === 'recommended' || scope === 'catalog') {
    const resolvedDirection: 'priciest' | 'cheapest' =
      direction ?? (keywords.priority === 'cheapest' ? 'cheapest' : 'priciest');

    const picked =
      scope === 'catalog'
        ? selectPlansAcrossCatalog(
            plans,
            resolvedDirection,
            SCOPED_PICK_COUNT,
            keywords.budget,
          )
        : pickPriceExtremeFromSet(
            // 방금 추천했던 것과 같은 결과를 재구성한다(NFR-005 결정성) - offset 0,
            // 지금 keywords 그대로.
            selectRecommendedPlans(plans, keywords).recommendations,
            resolvedDirection,
            SCOPED_PICK_COUNT,
          );

    const recommendations: PlanRecommendation[] = picked.map((item) => ({
      plan: item.plan,
      rank: item.rank,
      reason:
        scope === 'catalog'
          ? describeCatalogExtreme(resolvedDirection)
          : describeRecommendedExtreme(resolvedDirection),
    }));

    send({ event: 'recommendation', data: { plans: recommendations } });

    return {
      recommendations: toResultSummary(recommendations),
      scope,
      // scope: 'recommended'인데 직전 추천 자체가 없었으면(예: 추천받은 적 없이
      // 이 질문부터 옴) 빈 배열로 온다 - 시스템 프롬프트가 이 경우를 안내하라고 지시한다.
      hasMatch: recommendations.length > 0,
    };
  }

  // scope: 'alternative' - "~하나만 더", "가장 비슷한 다른 요금제". 원래 조건은
  // 그대로 두고, 이미 보여준 만큼만 건너뛴다.
  if (scope === 'alternative') {
    const original = selectRecommendedPlans(plans, keywords);
    const nextBatch = selectRecommendedPlans(
      plans,
      keywords,
      original.recommendations.length,
    );
    const picked = nextBatch.recommendations
      .slice(0, SCOPED_PICK_COUNT)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const recommendations: PlanRecommendation[] = picked.map((item) => ({
      plan: item.plan,
      rank: item.rank,
      reason: describeAlternativeMatch(),
    }));

    send({ event: 'recommendation', data: { plans: recommendations } });

    return {
      recommendations: toResultSummary(recommendations),
      scope,
      // 카탈로그가 작아 더 보여줄 게 안 남았으면 false - "더 보여드릴 만한 다른
      // 요금제가 없어요"처럼 안내하라고 시스템 프롬프트가 지시한다.
      hasMatch: recommendations.length > 0,
    };
  }

  const usageGb = keywords.dataUsageGb ?? 15;
  const {
    recommendations: scored,
    didRelaxBudget,
    didRelaxDataUsage,
    didRelaxTethering,
    isInterestBrowse,
    effectivePriority,
  } = selectRecommendedPlans(plans, keywords);

  const recommendations: PlanRecommendation[] = scored.map((item) => ({
    plan: item.plan,
    rank: item.rank,
    reason: isInterestBrowse
      ? describeInterestMatch()
      : effectivePriority === 'data'
        ? describeDataPriorityMatch(item.isWithinBudget)
        : effectivePriority === 'priciest'
          ? describePriciestMatch()
          : effectivePriority === 'cheapest'
            ? describeCheapestMatch()
            : describeFit(item.isWithinBudget, usageGb),
  }));

  send({ event: 'recommendation', data: { plans: recommendations } });

  // 다음 턴에서 모델이 자연어로 마무리 발언을 할 때 참고할 사실 - 실제 DB 값 + 완화 여부.
  return {
    recommendations: toResultSummary(recommendations),
    // CARD-020: 조건을 못 채워서 필터를 완화했으면 그 사실을 안내 문구에 반영하라고 알려준다.
    didRelaxBudget,
    didRelaxDataUsage,
    didRelaxTethering,
    // 예산/데이터 없이 관심사만으로 찾았다는 사실 - 마무리 응답에서 "예산에 맞춰서" 같은
    // 표현을 쓰지 않고 관심사 기준으로 설명하라고 시스템 프롬프트에서 안내한다.
    isInterestBrowse,
    // 'priciest'/'cheapest'/'data' 우선순위가 실제로 적용됐다는 사실 - keywords.priority를 모델이
    // 명시적으로 안 채웠어도(예산만 있고 데이터가 전혀 없어 서버가 자동으로 판단한
    // 경우 포함) 여기엔 실제로 적용된 값이 온다. 마무리 응답에서 "왜 이렇게 골랐는지"
    // 설명할 근거로 쓰라고 시스템 프롬프트에서 안내한다.
    effectivePriority,
  };
}
