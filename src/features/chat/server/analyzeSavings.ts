import { getRecentMonthlyUsage, getUserProfile } from '@/entities/user/server';
import type { Plan } from '@/entities/plan/types';
import type { SavingsAnalysis } from '@/entities/usage/types';
import { buildUsageTrend } from '@/features/chat/lib/buildUsageTrend';
import { decideSavings, type SavingsDecision } from '@/features/chat/lib/selectSavingsPlan';
import type { SSESend } from '@/features/chat/lib/sse';

interface RunSavingsAnalysisParams {
  /** 로그인 안 했으면 null - CARD-023: 절약 상담은 로그인 사용자 전용 */
  userId: string | null;
  allPlans: Plan[];
  send: SSESend;
  /**
   * plan_info: "내 요금제 정보 알려줘"(show_current_plan) - 최근 3개월 사용 이력
   *   조회 자체를 안 하고, 현재 요금제·잔여 사용량만 보여준다(이력이 없어도 동작).
   * trend: "사용량 추세 알려줘"(show_usage_trend) - 3개월 추세까지 포함.
   * savings: "절약해줘"(analyze_savings) - 추세 + 대안 요금제 판단까지 포함.
   */
  mode: 'plan_info' | 'trend' | 'savings';
}

// 절약/상향 판단 이유를 실제 계산값 기반으로 서술한다 - LLM이 숫자를 지어내지 않도록,
// 다음 턴 자연어 응답이 참고할 사실 문장을 여기서 만들어 tool 결과로 넘긴다.
function describeSavingsReason(decision: SavingsDecision): string {
  const usedGb = Math.round((decision.averageUsageMb / 1024) * 10) / 10;

  if (decision.type === 'downgrade') {
    return `최근 3개월 평균 데이터 사용량이 약 ${usedGb}GB로, 지금보다 저렴한 요금제로도 충분히 커버돼요.`;
  }
  if (decision.type === 'upgrade') {
    return (
      `최근 3개월 평균 데이터 사용량이 약 ${usedGb}GB로 현재 요금제 제공량을 넘어서고 있어요. ` +
      `월 ${decision.additionalMonthlyCost?.toLocaleString()}원만 더 내면 데이터 부족 없이 충분히 쓸 수 있어요.`
    );
  }
  return `최근 3개월 평균 데이터 사용량(약 ${usedGb}GB)이 현재 요금제에 이미 적합해요.`;
}

function toSavingsAnalysis(decision: SavingsDecision): SavingsAnalysis {
  const reason = describeSavingsReason(decision);

  if (decision.type === 'keep' || !decision.recommendedPlan) {
    return { type: 'keep', reason };
  }

  return {
    type: decision.type,
    reason,
    recommendedPlan: {
      plan: decision.recommendedPlan,
      annualSavings: decision.annualSavings,
    },
  };
}

/**
 * CARD-022~026/028 - 로그인 사용자의 실제 요금제·사용량으로 절약 상담을 수행한다.
 * usageAnalysis 이벤트를 내보내고, 다음 턴 자연어 마무리 응답이 참고할 요약을 돌려준다.
 *
 * 로그인 여부는 여기서 최종 판단한다(chatStream이 features/auth를 직접 참조할 수 없어서
 * route.ts가 미리 확인한 userId를 그대로 받는 구조) - CARD-023: 비로그인이면 카드 없이
 * 이유만 돌려주고, 다음 턴에서 로그인 안내로 자연스럽게 이어지게 한다.
 */
export async function runSavingsAnalysis({
  userId,
  allPlans,
  send,
  mode,
}: RunSavingsAnalysisParams): Promise<unknown> {
  if (!userId) {
    return { ok: false, reason: 'not_logged_in' };
  }

  const profile = await getUserProfile(userId);
  if (!profile || !profile.currentPlan) {
    return { ok: false, reason: 'no_current_plan' };
  }

  // "내 요금제 정보 알려줘"는 지금 쓰는 요금제·잔여 사용량만 보여주면 되고, 3개월
  // 사용 이력이 없어도(가입한 지 얼마 안 된 사용자 등) 동작해야 한다 - 그래서 이
  // 모드만 getRecentMonthlyUsage를 아예 건너뛴다.
  if (mode === 'plan_info') {
    send({
      event: 'usageAnalysis',
      data: {
        currentPlan: profile.currentPlan,
        remainingDataGb: profile.remainingDataGb,
        dataLimitGb: profile.dataLimitGb,
      },
    });

    // 요금제명·특징을 다음 턴 텍스트가 그대로 인용할 수 있게, 실제 보유 데이터를
    // 통째로 돌려준다(NFR-003~004 - 모델이 특징을 지어내지 않도록).
    return {
      ok: true,
      currentPlan: {
        name: profile.currentPlan.name,
        description: profile.currentPlan.description,
        monthlyFee: profile.currentPlan.monthlyFee,
        dataAllowance: profile.currentPlan.dataAllowance,
        voiceSms: profile.currentPlan.voiceSms,
        benefits: profile.currentPlan.benefits,
      },
      remainingDataGb: profile.remainingDataGb,
      dataLimitGb: profile.dataLimitGb,
    };
  }

  const usageHistory = await getRecentMonthlyUsage(userId);
  if (usageHistory.length === 0) {
    return { ok: false, reason: 'no_usage_history' };
  }

  const trend = buildUsageTrend(profile.currentPlan, usageHistory);
  const savings =
    mode === 'savings'
      ? toSavingsAnalysis(decideSavings(profile.currentPlan, usageHistory, allPlans))
      : undefined;

  send({
    event: 'usageAnalysis',
    data: {
      currentPlan: profile.currentPlan,
      remainingDataGb: profile.remainingDataGb,
      dataLimitGb: profile.dataLimitGb,
      trend,
      savings,
    },
  });

  return {
    ok: true,
    currentPlanName: profile.currentPlan.name,
    averageUsageMb: Math.round(trend.averageMb),
    savings: savings && {
      type: savings.type,
      reason: savings.reason,
      recommendedPlanName: savings.recommendedPlan?.plan.name,
      annualSavings: savings.recommendedPlan?.annualSavings,
    },
  };
}
