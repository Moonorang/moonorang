import { CheckCircle2, TrendingUp } from 'lucide-react';

import PlanCard from '@/entities/plan/ui/PlanCard';

import UsageAnalysisCard from '@/features/usage/components/UsageAnalysisCard';
import UsageTrendChart from '@/features/usage/components/UsageTrendChart';
import { formatGbLabel, toUnlimitedLabel } from '@/features/usage/lib/formatUsage';

import { cn } from '@/shared/utils/cn';
import { parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';
import type { UsageAnalysisResult } from '@/entities/usage/types';

interface UsageAnalysisSectionProps {
  data: UsageAnalysisResult;
  onJoin?: (plan: Plan) => void;
  onViewDetail?: (plan: Plan) => void;
  appendClassName?: string;
}

/**
 * CARD-022~028 - 채팅 안에서 사용량 분석 카드 + 3개월 추세 + (있으면) 절약 대안
 * 요금제까지 한 번에 조립한다. usageAnalysis 이벤트 하나를 그대로 받아 그린다.
 *
 * UsageAnalysisCard/UsageTrendChart는 이 도메인(usage)의 표현만 맡고, 이 컴포넌트가
 * entities/usage 데이터를 그 컴포넌트들의 props 모양으로 변환하는 조립을 담당한다.
 */
export default function UsageAnalysisSection({
  data,
  onJoin,
  onViewDetail,
  appendClassName,
}: UsageAnalysisSectionProps) {
  const { currentPlan, remainingDataGb, dataLimitGb, trend, savings } = data;
  // 잔여량 배지는 "부가통화 300분" 같은 덧붙는 설명 없이 기본 제공량만 무제한으로
  // 보여준다(요금제 상세 문구는 parseVoiceSms를 그대로 쓰는 PlanCard 쪽 몫).
  const { sms } = parseVoiceSms(currentPlan.voiceSms);
  const voiceBase = currentPlan.voiceSms.split('/')[0]?.trim() ?? '';
  const voiceRemaining = toUnlimitedLabel(voiceBase);
  const smsRemaining = toUnlimitedLabel(sms);
  const recommendedPlan = savings?.recommendedPlan;

  const usagePercentage = dataLimitGb
    ? Math.min(
        100,
        Math.max(0, Math.round(((dataLimitGb - remainingDataGb) / dataLimitGb) * 100)),
      )
    : 0;

  return (
    <div className={cn('flex w-full flex-col gap-4', appendClassName)}>
      <UsageAnalysisCard
        currentPlanName={currentPlan.name}
        currentPlanPrice={currentPlan.monthlyFee}
        dataRemaining={formatGbLabel(remainingDataGb)}
        voiceRemaining={voiceRemaining}
        smsRemaining={smsRemaining}
        usagePercentage={usagePercentage}
      />

      <div className="flex w-[80%] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={16} className="text-text-primary" aria-hidden />
          <h3 className="text-14 font-bold text-text-primary">
            최근 3개월 데이터 사용량
          </h3>
        </div>
        <UsageTrendChart
          points={trend.points}
          averageMb={trend.averageMb}
          planLimitMb={trend.planLimitMb}
        />
      </div>

      {savings?.type === 'keep' && (
        <div className="flex w-[80%] items-center gap-2 rounded-md bg-background-default p-4 text-text-primary shadow-default">
          <CheckCircle2 size={16} className="shrink-0 text-status-success" aria-hidden />
          <p className="text-12">지금 이용 중인 요금제가 이미 사용 패턴에 가장 적합해요.</p>
        </div>
      )}

      {recommendedPlan && (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-14 font-bold text-text-primary">
            {savings?.type === 'upgrade' ? '이런 요금제는 어때요?' : '이렇게 바꾸면 절약돼요'}
          </h3>
          <PlanCard
            plan={recommendedPlan.plan}
            annualSavings={recommendedPlan.annualSavings}
            onViewDetail={() => onViewDetail?.(recommendedPlan.plan)}
            onJoin={() => onJoin?.(recommendedPlan.plan)}
          />
        </div>
      )}
    </div>
  );
}
