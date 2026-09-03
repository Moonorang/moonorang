import AddOnDetailCard from '@/entities/addOn/ui/AddOnDetailCard';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';

import type { AddOn } from '@/entities/addOn/types';

interface AddOnConfirmDetailStepProps {
  addOn: AddOn;
  submitLabel: string;
  onNext: () => void;
}

/** 부가서비스 가입 1단계 - 고른 부가서비스가 맞는지 상세 내용으로 확인받는다 */
export default function AddOnConfirmDetailStep({
  addOn,
  submitLabel,
  onNext,
}: AddOnConfirmDetailStepProps) {
  return (
    <JoinStepLayout submitLabel={submitLabel} onSubmit={onNext}>
      <div className="pt-4">
        {/* 목록 상세와 같은 내용을 보여준다 - onJoin 은 안 넘긴다(이미 가입 절차 안이다) */}
        <AddOnDetailCard addOn={addOn} />
      </div>
    </JoinStepLayout>
  );
}
