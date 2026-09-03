'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import SubscriptionConfirmDetailStep from '@/features/join/components/SubscriptionConfirmDetailStep';
import SubscriptionConfirmStep from '@/features/join/components/SubscriptionConfirmStep';
import JoinCardFrame from '@/features/join/components/JoinCardFrame';
import CardStep from '@/features/join/components/CardStep';
import JoinSignupNotice from '@/features/join/components/JoinSignupNotice';
import PaymentLoading from '@/features/join/components/PaymentLoading';
import TermsStep from '@/features/join/components/TermsStep';
import { SUBSCRIPTION_JOIN_STEPS } from '@/features/join/data/steps';
import { SUBSCRIPTION_JOIN_TERMS } from '@/features/join/data/terms';
import { useJoinSteps } from '@/features/join/hooks/useJoinSteps';
import { useJoinSubmission } from '@/features/join/hooks/useJoinSubmission';
import { completeSubscriptionJoin } from '@/features/join/server/actions';

import type { Subscription } from '@/entities/subscription/types';
import type { JoinProgress } from '@/entities/join/types';
import type { CardValues } from '@/features/join/lib/cardSchema';

/** 카드 등록에 아직 아무것도 입력하지 않은 상태 */
const EMPTY_CARD: CardValues = {
  issuer: '',
  cardNumber: '',
  expiry: '',
};

interface SubscriptionJoinFlowCardProps {
  /** 신청할 구독 상품 */
  subscription: Subscription;
  /** 신청은 회원만 할 수 있다 - 비회원은 카카오 회원가입부터 거친다 */
  isLoggedIn?: boolean;
  /**
   * 비회원에게 보여줄 카카오 회원가입 버튼.
   * features 끼리 직접 참조하지 않으려고 슬롯으로 받는다.
   */
  renderSignup?: () => ReactNode;
  /** 신청이 끝났는지. 화면을 떠났다 돌아와도 두 번 신청되지 않게 대화 쪽이 들고 있다 */
  isCompleted?: boolean;
  /** 신청이 끝난 순간 한 번 불린다 - 결과는 대화에 새 메시지로 남는다 */
  onComplete?: () => void;
  /** CARD-046: 지난번에 어디까지 밟았는지 */
  progress?: JoinProgress;
  /** 진행 상태가 달라질 때마다 불린다 - 대화 쪽이 받아서 함께 저장한다 */
  onProgressChange?: (progress: JoinProgress) => void;
}

/**
 * DATA-015: 대화 안에서 단계별로 진행하는 구독 상품 가입 카드.
 *
 * 껍데기(JoinCardFrame)·단계 이동(useJoinSteps)·약관 화면(TermsStep)·카드 등록
 * (CardStep)을 요금제·부가서비스 카드와 함께 쓰고, 단계 구성만 다르다.
 *
 * 부가서비스와 갈라지는 지점은 결제다 - 통신요금에 합산되지 않고 등록한 카드로
 * 매달 같은 날 따로 빠져나가므로(DATA-017) 결제 수단을 한 단계 더 받는다.
 */
export default function SubscriptionJoinFlowCard({
  subscription,
  isLoggedIn = false,
  renderSignup,
  isCompleted = false,
  onComplete,
  progress,
  onProgressChange,
}: SubscriptionJoinFlowCardProps) {
  // 1. 상태 및 훅
  const {
    stepIndex,
    step,
    prevStepIndex,
    progressPosition,
    cardRef,
    goNext,
    goPrev,
  } = useJoinSteps({
    steps: SUBSCRIPTION_JOIN_STEPS,
    initialStepIndex: progress?.stepIndex,
  });

  const [agreedTermIds, setAgreedTermIds] = useState<string[]>(
    progress?.agreedTermIds ?? [],
  );
  /*
   * DATA-017: 다음 결제일 계산의 기준일. 렌더마다 new Date() 를 만들면 자정을
   * 넘기는 순간 화면에 보이는 날짜가 슬그머니 바뀌므로, 카드가 뜰 때 한 번 정해서
   * 붙들어 둔다. 실제로 저장되는 next_billing_date 는 서버가 정한다.
   */
  const [startedAt] = useState(() => new Date());
  // 카드번호는 저장하지 않아서 돌아오면 비어 있다 - 되돌아가 고칠 때만 쓰이는 값이다
  const [card, setCard] = useState<CardValues>(EMPTY_CARD);

  // 첫 그리기에서는 방금 복구한 값을 그대로 되돌려 보내는 셈이라 알리지 않는다
  const isFirstProgressRef = useRef(true);

  /** 신청하기부터 확정까지 - 세 가입 카드가 같이 쓰는 상태 기계 */
  const submission = useJoinSubmission({
    target: { kind: 'subscription', itemId: subscription.id },
    isLoggedIn,
    isCompleted,
    errorFallbackMessage: '신청을 완료하지 못했어요. 다시 시도해 주세요.',
    onSubmit: () =>
      completeSubscriptionJoin({ subscriptionId: subscription.id }),
    // 요금제와 달리 본인 확인이 없어 회원가입 화면에 넘길 값이 없다 -
    // 추가 정보 화면이 평소대로 이름·연락처를 물어본다(onBeforeSignup 없음).
    onComplete,
  });

  // 2. 부수 효과
  // CARD-046: 어디까지 왔는지가 달라질 때마다 대화 쪽에 알려 함께 저장하게 한다.
  useEffect(() => {
    if (isFirstProgressRef.current) {
      isFirstProgressRef.current = false;
      return;
    }

    onProgressChange?.({ stepIndex, agreedTermIds });
  }, [stepIndex, agreedTermIds, onProgressChange]);

  // 3. 이벤트 핸들러
  const handleCardNext = (values: CardValues) => {
    setCard(values);
    goNext();
  };

  const handlePrev = () => {
    // 신청하기를 물렀다는 뜻이므로 회원가입 안내를 접고 이어가기 표식도 거둔다
    submission.withdraw();
    goPrev();
  };

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  // 신청 확인 자리에는 상황에 따라 셋 중 하나가 온다 -
  // 회원가입 안내(비회원) > 처리 중 > 평소의 신청 확인
  const confirmBody = submission.isSignupRequired ? (
    <JoinSignupNotice onPrev={submission.closeSignupNotice}>
      {renderSignup?.()}
    </JoinSignupNotice>
  ) : submission.isSubmitting ? (
    <PaymentLoading />
  ) : (
    <SubscriptionConfirmStep
      subscription={subscription}
      startedAt={startedAt}
      submitLabel={submitLabel}
      isCompleted={isCompleted}
      errorMessage={submission.errorMessage}
      onPrev={handlePrev}
      onNext={submission.submit}
    />
  );

  return (
    <JoinCardFrame
      cardRef={cardRef}
      title={step.title}
      progressPosition={progressPosition}
      progressAriaLabel="구독 가입 진행 상황"
      isPrevDisabled={
        prevStepIndex === -1 || submission.isSubmitting || isCompleted
      }
      onPrev={handlePrev}
    >
      {step.id === 'subscription' && (
        <SubscriptionConfirmDetailStep
          subscription={subscription}
          submitLabel={submitLabel}
          onNext={goNext}
        />
      )}

      {step.id === 'terms' && (
        <TermsStep
          terms={SUBSCRIPTION_JOIN_TERMS}
          submitLabel={submitLabel}
          agreedIds={agreedTermIds}
          onAgreedIdsChange={setAgreedTermIds}
          onNext={goNext}
        />
      )}

      {step.id === 'card' && (
        <CardStep
          submitLabel={submitLabel}
          defaultValues={card}
          onPrev={handlePrev}
          onNext={handleCardNext}
        />
      )}

      {step.id === 'confirm' && confirmBody}
    </JoinCardFrame>
  );
}
