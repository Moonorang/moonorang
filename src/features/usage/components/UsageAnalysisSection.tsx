'use client';

import { useState } from 'react';

import { TrendingUp } from 'lucide-react';

import PlanCard from '@/entities/plan/ui/PlanCard';
import PlanDetailModal from '@/entities/plan/ui/PlanDetailModal';

import UsageAnalysisCard from '@/features/usage/components/UsageAnalysisCard';
import UsageTrendChart from '@/features/usage/components/UsageTrendChart';
import {
  formatGbLabel,
  toUnlimitedLabel,
} from '@/features/usage/lib/formatUsage';

import { cn } from '@/shared/utils/cn';
import { parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';
import type { UsageAnalysisResult } from '@/entities/usage/types';

interface UsageAnalysisSectionProps {
  data: UsageAnalysisResult;
  /** 신청하기 - 대안 요금제 카드와 그 상세에서 함께 쓴다 */
  onJoin?: (plan: Plan) => void;
  appendClassName?: string;
}

/**
 * CARD-022~028 - 채팅 안에서 사용량 분석 카드 + 3개월 추세 + (있으면) 절약 대안
 * 요금제까지 한 번에 조립한다. usageAnalysis 이벤트 하나를 그대로 받아 그린다.
 *
 * UsageAnalysisCard/UsageTrendChart는 이 도메인(usage)의 표현만 맡고, 이 컴포넌트가
 * entities/usage 데이터를 그 컴포넌트들의 props 모양으로 변환하는 조립을 담당한다.
 *
 * DATA-003 상세 보기는 바깥으로 올리지 않고 여기서 직접 연다 - 목록에서 쓰는 것과
 * 같은 모달(entities/plan)이라 이 컴포넌트만으로 완결되고, 채팅 추천 카드
 * (PlanCardCarousel)도 같은 방식이다.
 */
export default function UsageAnalysisSection({
  data,
  onJoin,
  appendClassName,
}: UsageAnalysisSectionProps) {
  // 열려 있는 상세. null 이면 닫힌 상태
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
        Math.max(
          0,
          Math.round(((dataLimitGb - remainingDataGb) / dataLimitGb) * 100),
        ),
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

      <div className="flex w-[min(80%,440px)] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
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

      {/* keep일 땐 대안 요금제도, 별도 박스도 없다 - 왜 지금이 최적인지는 챗봇 답변
          텍스트가 savings.reason을 인용해서 말해준다(systemPrompt 참고). */}

      {recommendedPlan && (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-14 font-bold text-text-primary">
            {savings?.type === 'upgrade'
              ? '이런 요금제는 어때요?'
              : '이렇게 바꾸면 절약돼요'}
          </h3>
          <PlanCard
            plan={recommendedPlan.plan}
            annualSavings={recommendedPlan.annualSavings}
            reason={savings?.reason}
            onViewDetail={() => setSelectedPlan(recommendedPlan.plan)}
            onJoin={() => onJoin?.(recommendedPlan.plan)}
          />
        </div>
      )}

      {/* DATA-003: 상세보기를 누르면 목록에서와 같은 상세가 화면을 덮으며 들어온다 */}
      <PlanDetailModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onJoin={(plan) => {
          // 가입 카드는 대화 맨 끝에 붙으므로, 화면을 덮고 있는 상세를 먼저 걷어낸다
          setSelectedPlan(null);
          onJoin?.(plan);
        }}
      />
    </div>
  );
}
