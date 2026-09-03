import SubscriptionDetailCard from '@/entities/subscription/ui/SubscriptionDetailCard';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';

import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionConfirmDetailStepProps {
  subscription: Subscription;
  submitLabel: string;
  onNext: () => void;
}

/** 구독 가입 1단계 - 고른 구독 상품이 맞는지 상세 내용으로 확인받는다 */
export default function SubscriptionConfirmDetailStep({
  subscription,
  submitLabel,
  onNext,
}: SubscriptionConfirmDetailStepProps) {
  return (
    <JoinStepLayout submitLabel={submitLabel} onSubmit={onNext}>
      <div className="pt-4">
        {/* 목록 상세와 같은 내용 - onJoin 은 안 넘긴다(이미 가입 절차 안이다) */}
        <SubscriptionDetailCard subscription={subscription} />
      </div>
    </JoinStepLayout>
  );
}
