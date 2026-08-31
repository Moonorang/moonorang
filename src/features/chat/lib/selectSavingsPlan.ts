import { parseDataAllowanceToGb } from '@/entities/plan';
import type { Plan } from '@/entities/plan/types';
import type { MonthlyUsage } from '@/entities/user/types';

// CARD-025~026 - 최근 3개월 평균 사용량이 현재 요금제 제공량의 이 비율 이하면
// "여유가 있다"고 보고 더 저렴한 요금제를 찾는다.
const DOWNGRADE_USAGE_RATIO = 0.7;
// 이 비율 이상이면 "빠듯하다"고 보고 데이터가 더 넉넉한 요금제를 찾는다.
const UPGRADE_USAGE_RATIO = 0.9;

const MB_PER_GB = 1024;

export interface SavingsDecision {
  /** downgrade: 더 저렴한 요금제로 절약 가능 / upgrade: 데이터가 부족해 상위 요금제 필요 / keep: 지금 요금제가 최적 */
  type: 'downgrade' | 'upgrade' | 'keep';
  averageUsageMb: number;
  /** 무제한 요금제면 Infinity */
  currentPlanDataGb: number;
  recommendedPlan?: Plan;
  /** downgrade일 때만 - 항상 양수 */
  monthlySavings?: number;
  annualSavings?: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * 최근 3개월 평균 데이터 사용량과 현재 요금제 제공량을 비교해, 더 저렴한 요금제로
 * 바꿀 여지가 있는지(downgrade) / 데이터가 부족해 올려야 하는지(upgrade) /
 * 지금이 최적인지(keep)를 계산한다.
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
  // parseDataAllowanceToGb는 0을 돌려주지 않는다(무제한/파싱 불가는 Infinity) - 나눗셈이
  // 안전하고, 무제한 요금제는 자연히 비율 0(=항상 "여유 있음" 판정)으로 처리된다.
  const usageRatio = averageUsageGb / currentPlanDataGb;

  const otherPlans = allPlans.filter((plan) => plan.id !== currentPlan.id);

  if (usageRatio <= DOWNGRADE_USAGE_RATIO) {
    // 평균 사용량을 감당하면서(약간의 여유 포함) 더 저렴한 요금제 중 가장 싼 것
    const candidates = otherPlans
      .filter((plan) => plan.monthlyFee < currentPlan.monthlyFee)
      .filter((plan) => parseDataAllowanceToGb(plan.dataAllowance) >= averageUsageGb)
      .sort((a, b) => a.monthlyFee - b.monthlyFee);

    const recommendedPlan = candidates[0];
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

  if (usageRatio >= UPGRADE_USAGE_RATIO) {
    // 현재보다 데이터가 많으면서, 그 중 가장 저렴한 것(과하게 큰 요금제로 안 넘어가게)
    const candidates = otherPlans
      .filter((plan) => parseDataAllowanceToGb(plan.dataAllowance) > currentPlanDataGb)
      .filter((plan) => parseDataAllowanceToGb(plan.dataAllowance) >= averageUsageGb)
      .sort((a, b) => a.monthlyFee - b.monthlyFee);

    const recommendedPlan = candidates[0];
    if (recommendedPlan) {
      return {
        type: 'upgrade',
        averageUsageMb,
        currentPlanDataGb,
        recommendedPlan,
      };
    }
  }

  // CARD-026: 절감 여지가 없으면 현재 요금제 유지 안내
  return { type: 'keep', averageUsageMb, currentPlanDataGb };
}
