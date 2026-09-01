import JoinStepLayout from '@/features/join/components/JoinStepLayout';

import { formatWon } from '@/shared/utils/formatCurrency';

import type { Plan } from '@/entities/plan/types';

interface ConfirmStepProps {
  plan: Plan;
  submitLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * CARD-042: 마지막 단계 - 확정하기 전에 무엇을 얼마에 가입하는지 다시 보여준다.
 * 입력한 정보(이름·주민등록번호·카드번호)는 여기 그리지 않는다 - 시안에 없고,
 * 대화 화면에 민감한 값을 남길 이유도 없다.
 */
export default function ConfirmStep({
  plan,
  submitLabel,
  onPrev,
  onNext,
}: ConfirmStepProps) {
  return (
    <JoinStepLayout submitLabel={submitLabel} onSubmit={onNext} onPrev={onPrev}>
      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">
          월 납부금액(부가세포함)
        </p>
        <p className="text-right text-14 font-medium text-action-primary">
          월 {formatWon(plan.monthlyFee)}
        </p>
      </div>

      <div className="mt-4 h-px w-full bg-border-default" />

      <div className="mt-5 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">요금제</p>
        <p className="text-12 text-text-secondary">{plan.name}</p>
      </div>
    </JoinStepLayout>
  );
}
