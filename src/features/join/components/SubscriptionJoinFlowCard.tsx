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
import { PAYMENT_DELAY_MS } from '@/features/join/data/complete';
import { SUBSCRIPTION_JOIN_STEPS } from '@/features/join/data/steps';
import { SUBSCRIPTION_JOIN_TERMS } from '@/features/join/data/terms';
import { useJoinSteps } from '@/features/join/hooks/useJoinSteps';
import { completeSubscriptionJoin } from '@/features/join/server/actions';

import type { Subscription } from '@/entities/subscription/types';
import {
  clearPendingJoinPayment,
  hasPendingJoinPayment,
  savePendingJoinPayment,
} from '@/entities/join';
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
  // 신청하기를 누른 뒤 결과가 대화에 나오기 전까지의 처리 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 비회원이 신청하기를 눌러 회원가입 안내로 갈아탄 상태
  const [isSignupRequired, setIsSignupRequired] = useState(false);
  // COMMON-002: 신청을 저장하지 못했을 때 신청 확인 화면에 남기는 사유
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 첫 그리기에서는 방금 복구한 값을 그대로 되돌려 보내는 셈이라 알리지 않는다
  const isFirstProgressRef = useRef(true);
  // 회원가입을 마치고 돌아와 신청을 이어간 적이 있는지 - 한 번만 이어간다
  const hasResumedSubmitRef = useRef(false);
  const target = { kind: 'subscription' as const, itemId: subscription.id };

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
    setIsSignupRequired(false);
    // 신청하기를 물렀다는 뜻이므로, 돌아왔을 때 저절로 신청되지 않게 표식을 거둔다
    clearPendingJoinPayment();
    goPrev();
  };

  /** 처리가 끝난 뒤 - 이용 내역을 남기고 결과를 대화로 넘긴다 */
  const finishSubmit = async () => {
    // 서버 액션이 아예 실패(네트워크 끊김 등)하면 예외로 튀는데, 그대로 두면
    // 처리 중 화면에 갇힌다. 사유를 보여주고 신청 확인으로 되돌린다(COMMON-002).
    const { errorMessage } = await completeSubscriptionJoin({
      subscriptionId: subscription.id,
    }).catch((error: unknown) => {
      console.error('[join] 구독 신청 처리 실패', error);

      return { errorMessage: '신청을 완료하지 못했어요. 다시 시도해 주세요.' };
    });

    setIsSubmitting(false);

    if (errorMessage) {
      setSubmitError(errorMessage);
      return;
    }

    clearPendingJoinPayment();
    onComplete?.();
  };

  const handleSubmit = () => {
    if (isSubmitting || isCompleted) return;

    setSubmitError(null);

    // 신청은 회원만 할 수 있어서, 비회원은 회원가입부터 거친다.
    // 요금제와 달리 본인 확인이 없어 넘길 값이 없으므로 signupPrefill 은 남기지 않는다 -
    // 추가 정보 화면이 평소대로 이름·연락처를 물어본다.
    if (!isLoggedIn) {
      savePendingJoinPayment(target);
      setIsSignupRequired(true);
      return;
    }

    setIsSubmitting(true);
  };

  /*
   * 아래 두 효과만 3번(이벤트 핸들러) 뒤에 있는 이유는 finishSubmit/handleSubmit 을
   * 불러야 해서다. 타이머를 핸들러가 아니라 상태가 소유하는 이유는 JoinFlowCard 와
   * 같다 - 화면이 다시 붙어도 타이머가 같이 되살아나야 '처리 중'에 갇히지 않는다.
   */
  useEffect(() => {
    if (!isSubmitting) return;

    const timer = setTimeout(() => void finishSubmit(), PAYMENT_DELAY_MS);

    return () => clearTimeout(timer);
    // finishSubmit 은 매 렌더 새로 만들어져서 넣으면 타이머가 계속 다시 걸린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting]);

  // 카카오 회원가입을 마치고 돌아왔으면 신청을 이어서 끝낸다(JoinFlowCard 와 같은 규칙)
  useEffect(() => {
    if (!isLoggedIn || isCompleted || isSubmitting) return;
    if (hasResumedSubmitRef.current) return;
    if (!hasPendingJoinPayment(target)) return;

    hasResumedSubmitRef.current = true;

    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       sessionStorage(외부 저장소)에 남은 표식을 읽어와 그때 시작하는 동작이라,
       이 규칙이 막으려는 "반복 렌더로 이어지는 setState"가 아니다. */
    handleSubmit();
  });

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  // 신청 확인 자리에는 상황에 따라 셋 중 하나가 온다 -
  // 회원가입 안내(비회원) > 처리 중 > 평소의 신청 확인
  const confirmBody = isSignupRequired ? (
    <JoinSignupNotice onPrev={() => setIsSignupRequired(false)}>
      {renderSignup?.()}
    </JoinSignupNotice>
  ) : isSubmitting ? (
    <PaymentLoading />
  ) : (
    <SubscriptionConfirmStep
      subscription={subscription}
      startedAt={startedAt}
      submitLabel={submitLabel}
      isCompleted={isCompleted}
      errorMessage={submitError}
      onPrev={handlePrev}
      onNext={handleSubmit}
    />
  );

  return (
    <JoinCardFrame
      cardRef={cardRef}
      title={step.title}
      progressPosition={progressPosition}
      progressAriaLabel="구독 가입 진행 상황"
      isPrevDisabled={prevStepIndex === -1 || isSubmitting || isCompleted}
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
