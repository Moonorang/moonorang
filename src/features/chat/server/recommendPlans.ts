import type { Plan } from '@/entities/plan/types';
import { selectRecommendedPlans } from '@/features/chat/lib/selectPlans';
import type { SSESend } from '@/features/chat/lib/sse';
import type { ChatKeywords, PlanRecommendation } from '@/features/chat/types';

// 채점 결과가 왜 그 순위인지 짧게 서술한다. 지금 화면(PlanCard)엔 노출 안 되지만
// PlanRecommendation.reason 계약을 채워두면 나중에 카드에 붙일 때 바로 쓸 수 있다.
// 자세한 설명(혜택 등)은 이 문장이 아니라 이어지는 LLM의 자연어 응답이 맡는다.
function describeFit(isWithinBudget: boolean, usageGb: number): string {
  const budgetNote = isWithinBudget ? '예산 안에서' : '예산을 조금 넘지만';
  return `${budgetNote} 데이터 사용 패턴(약 ${usageGb}GB 기준)에 맞춰 계산한 요금제예요.`;
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
export function runPlanRecommendation(
  plans: Plan[],
  keywords: ChatKeywords,
  send: SSESend,
): unknown {
  const usageGb = keywords.dataUsageGb ?? 15;
  const { recommendations: scored, didRelaxBudget, didRelaxTethering } =
    selectRecommendedPlans(plans, keywords);

  const recommendations: PlanRecommendation[] = scored.map((item) => ({
    plan: item.plan,
    rank: item.rank,
    reason: describeFit(item.isWithinBudget, usageGb),
  }));

  send({ event: 'recommendation', data: { plans: recommendations } });

  // 다음 턴에서 모델이 자연어로 마무리 발언을 할 때 참고할 사실 - 실제 DB 값 + 완화 여부.
  return {
    recommendations: recommendations.map((item) => ({
      rank: item.rank,
      name: item.plan.name,
      monthlyFee: item.plan.monthlyFee,
      dataAllowance: item.plan.dataAllowance,
      benefits: item.plan.benefits,
    })),
    // CARD-020: 조건을 못 채워서 필터를 완화했으면 그 사실을 안내 문구에 반영하라고 알려준다.
    didRelaxBudget,
    didRelaxTethering,
  };
}
