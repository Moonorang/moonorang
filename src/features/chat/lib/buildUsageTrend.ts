import { parseDataAllowanceToGb } from '@/entities/plan';
import type { Plan } from '@/entities/plan/types';
import type { MonthlyUsage } from '@/entities/user/types';
import type { UsageTrendData } from '@/entities/usage/types';

const MB_PER_GB = 1024;

/**
 * CARD-024/028 - 최근 3개월 사용량 + 평균선 + 요금제 한계선을 차트가 그대로 그릴 수
 * 있는 형태로 조립한다. 무제한 요금제는 한계선이 의미 없어서 null로 둔다.
 */
export function buildUsageTrend(
  currentPlan: Plan,
  usageHistory: MonthlyUsage[],
): UsageTrendData {
  const points = usageHistory.map((usage) => ({
    billingMonth: usage.billingMonth,
    dataUsedMb: usage.dataUsedMb,
  }));

  const averageMb =
    points.length === 0
      ? 0
      : points.reduce((sum, point) => sum + point.dataUsedMb, 0) / points.length;

  const planLimitGb = parseDataAllowanceToGb(currentPlan.dataAllowance);
  const planLimitMb = Number.isFinite(planLimitGb) ? planLimitGb * MB_PER_GB : null;

  return { points, averageMb, planLimitMb };
}
