import { parseDataAllowanceToGb } from '@/entities/plan';
import type { Plan } from '@/entities/plan/types';
import type { MonthlyUsage } from '@/entities/user/types';

const MB_PER_GB = 1024;

export interface SavingsDecision {
  /** downgrade: 더 저렴한 요금제로 절약 가능 / upgrade: 평균 사용량이 제공량을 넘어서 상위 요금제 필요 / keep: 지금 요금제가 최적 */
  type: 'downgrade' | 'upgrade' | 'keep';
  averageUsageMb: number;
  /** 무제한 요금제면 Infinity */
  currentPlanDataGb: number;
  recommendedPlan?: Plan;
  /** downgrade일 때만 - 항상 양수 */
  monthlySavings?: number;
  annualSavings?: number;
  /** upgrade일 때만 - 항상 양수 ("이만큼만 추가하면 충분히 쓸 수 있어요") */
  additionalMonthlyCost?: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * 최근 3개월 평균 데이터 사용량과 현재 요금제 제공량을 비교해 판단한다.
 *
 * - **upgrade 우선**: 평균 사용량이 현재 제공량을 이미 넘어섰으면(=매달 데이터가 부족한
 *   상황), 그걸 감당할 수 있는 요금제 중 가장 싼 것을 "이 정도만 추가하면 충분히
 *   쓸 수 있다"는 식으로 제안한다. 데이터가 부족한데 절약을 권할 순 없으니 이 판단이
 *   downgrade보다 우선한다.
 * - **downgrade는 항상 시도**: 부족하지 않다면(=제공량 안에서 쓰고 있다면), 지금 딱
 *   맞게 쓰고 있어도 상관없이 - 평균 사용량을 여전히 커버하면서 더 저렴한 요금제가
 *   하나라도 있으면 그걸 제안한다. 사용률이 일정 비율 이하일 때만 알려주는 임계치는
 *   두지 않는다 - 절약할 수 있으면 항상 알려주는 게 사용자에게 유리하기 때문이다.
 * - 어느 쪽에도 후보가 없으면(이미 제일 싸거나, 이미 최상위 요금제) 유지(keep).
 *
 * CARD-001과 같은 원칙: 판단과 요금제 선정은 여기서 전부 결정론적으로 계산하고,
 * LLM은 이 결과를 문장으로 설명하는 역할만 한다.
 */
export function decideSavings(
  currentPlan: Plan,
  usageHistory: MonthlyUsage[],
  allPlans: Plan[],
): SavingsDecision {
  const averageUsageMb = average(usageHistory.map((usage) => usage.dataUsedMb));
  const averageUsageGb = averageUsageMb / MB_PER_GB;
  const currentPlanDataGb = parseDataAllowanceToGb(currentPlan.dataAllowance);

  const otherPlans = allPlans.filter((plan) => plan.id !== currentPlan.id);
  const coversUsage = (plan: Plan) =>
    parseDataAllowanceToGb(plan.dataAllowance) >= averageUsageGb;
  const cheapestFirst = (a: Plan, b: Plan) => a.monthlyFee - b.monthlyFee;

  // 평균 사용량이 현재 제공량을 이미 넘어섰으면 - 데이터 부족 상황이 최우선
  if (averageUsageGb > currentPlanDataGb) {
    const recommendedPlan = otherPlans
      .filter(coversUsage)
      .sort(cheapestFirst)[0];

    if (recommendedPlan) {
      return {
        type: 'upgrade',
        averageUsageMb,
        currentPlanDataGb,
        recommendedPlan,
        additionalMonthlyCost: recommendedPlan.monthlyFee - currentPlan.monthlyFee,
      };
    }
    // 커버할 수 있는 요금제가 없으면(이미 최상위) 유지로 떨어진다
  } else {
    // 부족하지 않다면, 지금 사용률과 무관하게 - 커버하면서 더 저렴한 요금제가
    // 있으면 항상 알려준다(임계치 없음).
    const recommendedPlan = otherPlans
      .filter((plan) => plan.monthlyFee < currentPlan.monthlyFee)
      .filter(coversUsage)
      .sort(cheapestFirst)[0];

    if (recommendedPlan) {
      const monthlySavings = currentPlan.monthlyFee - recommendedPlan.monthlyFee;
      return {
        type: 'downgrade',
        averageUsageMb,
        currentPlanDataGb,
        recommendedPlan,
        monthlySavings,
        annualSavings: monthlySavings * 12,
      };
    }
  }

  // CARD-026: 절감 여지도, 부족분을 메울 후보도 없으면 현재 요금제 유지 안내
  return { type: 'keep', averageUsageMb, currentPlanDataGb };
}
