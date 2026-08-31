import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import PlanDetailCard from '@/features/join/components/PlanDetailCard';

import type { Plan } from '@/entities/plan/types';

interface PlanConfirmStepProps {
  plan: Plan;
  submitLabel: string;
  onNext: () => void;
}

/** CARD-033: 1단계 - 고른 요금제가 맞는지 상세 내용으로 확인받는다 */
export default function PlanConfirmStep({
  plan,
  submitLabel,
  onNext,
}: PlanConfirmStepProps) {
  return (
    <JoinStepLayout submitLabel={submitLabel} onSubmit={onNext}>
      <div className="pt-4">
        <PlanDetailCard plan={plan} />
      </div>
    </JoinStepLayout>
  );
}
