import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import {
  getProratedFee,
  getProrationPeriod,
} from '@/features/join/lib/prorate';

import type { AddOn } from '@/entities/addOn/types';
import { formatWon } from '@/shared/utils/formatCurrency';

interface AddOnConfirmStepProps {
  addOn: AddOn;
  /** 일할 계산의 기준일 - 카드가 한 번 정해서 내려준다(렌더마다 달라지면 안 된다) */
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

/** 월/일 만 뽑아 "9월 3일" 로 - 해가 바뀌는 경우가 없는 이번 달 안의 날짜다 */
function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 부가서비스 가입 3단계 - 확정하기 전에 무엇을 얼마에 신청하는지 다시 보여준다.
 *
 * 요금제의 ConfirmStep 과 달리 월 요금이 아니라 이번 달 예상 청구액을 앞세운다 -
 * DATA-012 대로 이용한 기간만큼만 청구되므로, 사용자가 실제로 내게 될 금액은
 * 기준 금액이 아니라 이쪽이기 때문이다.
 */
export default function AddOnConfirmStep({
  addOn,
  startedAt,
  submitLabel,
  isCompleted = false,
  errorMessage,
  onPrev,
  onNext,
}: AddOnConfirmStepProps) {
  const { remainingDays, lastDate } = getProrationPeriod(startedAt);
  const proratedFee = getProratedFee(addOn.baseMonthlyRate, startedAt);

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
          이번 달 예상 청구금액
        </p>
        <p className="text-right text-14 font-medium text-action-primary">
          {formatWon(proratedFee)}
        </p>
        {/* DATA-012: 왜 기준 금액과 다른지 - 근거가 되는 기간을 함께 보여준다 */}
        <p className="text-right text-10 text-text-secondary">
          {formatMonthDay(startedAt)}~{formatMonthDay(lastDate)} ·{' '}
          {remainingDays}일 일할 계산
        </p>
      </div>

      <div className="mt-4 h-px w-full bg-border-default" />

      <div className="mt-5 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">부가서비스</p>
        <p className="text-12 text-text-secondary">{addOn.title}</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">
          다음 달부터 월 요금
        </p>
        <p className="text-12 text-text-secondary">
          {formatWon(addOn.baseMonthlyRate)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-12 font-medium text-text-primary">결제 방법</p>
        {/* 별도 결제 수단을 받지 않는 이유를 여기서 밝힌다 - 카드 등록 단계가 없다 */}
        <p className="text-12 text-text-secondary">매월 통신요금에 합산 청구</p>
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
