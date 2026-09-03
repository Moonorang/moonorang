import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import { getNextBillingDate } from '@/features/join/lib/billing';

import { getDiscountedFee } from '@/entities/subscription/lib/getDiscountedFee';
import type { Subscription } from '@/entities/subscription/types';
import { formatWon } from '@/shared/utils/formatCurrency';

interface SubscriptionConfirmStepProps {
  subscription: Subscription;
  /** 결제일 계산의 기준일 - 카드가 한 번 정해서 내려준다(렌더마다 달라지면 안 된다) */
  startedAt: Date;
  submitLabel: string;
  /**
   * 이미 신청을 마친 카드인지. 신청하기는 두 번 눌리면 안 되고 이전도 되돌아가
   * 고칠 것이 없어서, 두 버튼을 함께 잠근다.
   */
  isCompleted?: boolean;
  /** COMMON-002: 신청을 저장하지 못했을 때의 사유 */
  errorMessage?: string | null;
  onPrev: () => void;
  onNext: () => void;
}

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 구독 가입 4단계 - 확정하기 전에 무엇을 얼마에, 언제부터 결제하는지 보여준다.
 *
 * 부가서비스의 AddOnConfirmStep 과 달리 일할 계산이 없다 - 구독은 신청한 날
 * 한 달치가 결제되고 그 뒤로 매달 같은 날 갱신되기 때문이다(DATA-017).
 */
export default function SubscriptionConfirmStep({
  subscription,
  startedAt,
  submitLabel,
  isCompleted = false,
  errorMessage,
  onPrev,
  onNext,
}: SubscriptionConfirmStepProps) {
  const { fee, label } = getDiscountedFee(
    subscription.baseMonthlyFee,
    subscription.discount,
  );
  const nextBillingDate = getNextBillingDate(startedAt);

  return (
    <JoinStepLayout
      submitLabel={submitLabel}
      onSubmit={onNext}
      isSubmitDisabled={isCompleted}
      onPrev={onPrev}
      isPrevDisabled={isCompleted}
    >
      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">
          오늘 결제금액(부가세포함)
        </p>
        <p className="text-right text-14 font-medium text-action-primary">
          월 {formatWon(fee)}
        </p>
        {/* 할인이 있을 때만 원래 가격을 함께 보여준다 */}
        {label && (
          <p className="text-right text-10 text-text-secondary">
            {label} · 정상가 {formatWon(subscription.baseMonthlyFee)}
          </p>
        )}
      </div>

      <div className="mt-4 h-px w-full bg-border-default" />

      <div className="mt-5 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">구독 상품</p>
        <p className="text-12 text-text-secondary">{subscription.name}</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">다음 결제일</p>
        <p className="text-12 text-text-secondary">
          {formatMonthDay(nextBillingDate)} · 매달 같은 날 자동 결제
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">결제 수단</p>
        {/* 카드번호는 그리지 않는다 - 대화 화면에 민감한 값을 남길 이유가 없다
            (요금제 ConfirmStep 과 같은 규칙) */}
        <p className="text-12 text-text-secondary">등록하신 카드</p>
      </div>

      {/* 다시 시도는 아래 신청하기를 한 번 더 누르면 된다 */}
      {errorMessage && (
        <p role="alert" className="mt-4 text-center text-12 text-status-error">
          {errorMessage}
        </p>
      )}
    </JoinStepLayout>
  );
}
