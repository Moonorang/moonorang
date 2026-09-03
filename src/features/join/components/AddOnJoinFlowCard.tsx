'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import AddOnConfirmDetailStep from '@/features/join/components/AddOnConfirmDetailStep';
import AddOnConfirmStep from '@/features/join/components/AddOnConfirmStep';
import JoinCardFrame from '@/features/join/components/JoinCardFrame';
import JoinSignupNotice from '@/features/join/components/JoinSignupNotice';
import PaymentLoading from '@/features/join/components/PaymentLoading';
import TermsStep from '@/features/join/components/TermsStep';
import { ADD_ON_JOIN_STEPS } from '@/features/join/data/steps';
import { ADD_ON_JOIN_TERMS } from '@/features/join/data/terms';
import { useJoinSteps } from '@/features/join/hooks/useJoinSteps';
import { useJoinSubmission } from '@/features/join/hooks/useJoinSubmission';
import { completeAddOnJoin } from '@/features/join/server/actions';

import type { AddOn } from '@/entities/addOn/types';
import type { JoinProgress } from '@/entities/join/types';

interface AddOnJoinFlowCardProps {
  /** 신청할 부가서비스 */
  addOn: AddOn;
  /**
   * 신청은 회원만 할 수 있다 - 비회원은 첫 단계에서 로그인 안내로 막아선다.
   * 아직 확인 중이면 undefined 로 온다.
   */
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
 * DATA-010: 대화 안에서 단계별로 진행하는 부가서비스 가입 카드.
 *
 * 요금제 가입(JoinFlowCard)과 껍데기(JoinCardFrame)·단계 이동(useJoinSteps)·약관
 * 화면(TermsStep)은 함께 쓰고, 단계 구성만 다르다 - 본인 확인과 카드 등록이 없다.
 * 이미 계약된 회선에 항목을 하나 얹는 일이라 본인 확인을 다시 받을 이유가 없고,
 * 이용 요금은 통신요금에 합산되므로(DATA-012) 결제 수단도 따로 받지 않는다.
 */
export default function AddOnJoinFlowCard({
  addOn,
  isLoggedIn,
  renderSignup,
  isCompleted = false,
  onComplete,
  progress,
  onProgressChange,
}: AddOnJoinFlowCardProps) {
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
    steps: ADD_ON_JOIN_STEPS,
    initialStepIndex: progress?.stepIndex,
  });

  const [agreedTermIds, setAgreedTermIds] = useState<string[]>(
    progress?.agreedTermIds ?? [],
  );
  /*
   * DATA-012: 일할 계산의 기준일. 렌더마다 new Date() 를 만들면 자정을 넘기는 순간
   * 화면에 보이는 금액이 슬그머니 바뀌므로, 카드가 뜰 때 한 번 정해서 붙들어 둔다.
   * 실제로 저장되는 started_at 은 서버가 정한다(completeAddOnJoin).
   */
  const [startedAt] = useState(() => new Date());

  // 첫 그리기에서는 방금 복구한 값을 그대로 되돌려 보내는 셈이라 알리지 않는다
  const isFirstProgressRef = useRef(true);

  /** 신청하기부터 확정까지 - 세 가입 카드가 같이 쓰는 상태 기계 */
  const submission = useJoinSubmission({
    target: { kind: 'addOn', itemId: addOn.id },
    isLoggedIn,
    isCompleted,
    errorFallbackMessage: '신청을 완료하지 못했어요. 다시 시도해 주세요.',
    onSubmit: () => completeAddOnJoin({ addOnId: addOn.id }),
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
  const handlePrev = () => {
    // 신청하기를 물렀다는 뜻이므로 회원가입 안내를 접고 이어가기 표식도 거둔다
    submission.withdraw();
    goPrev();
  };

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  /*
   * 이 절차는 이미 쓰고 있는 회선에 항목을 얹는 일이라 회원이 아니면 성립하지
   * 않는다. 그래서 요금제(CARD-044: 마지막 결제 단계에서 회원가입)와 달리, 절차를
   * 다 밟게 한 뒤 막지 않고 시작하는 자리에서 알린다 - 약관까지 읽고 나서야
   * 로그인하라는 말을 듣는 것이 사용자 입장에서 헛걸음이기 때문이다.
   *
   * 로그인하고 돌아오면 대화가 승계되면서(CHAT-011/012) 이 카드도 그대로 되살아나
   * 여기서부터 이어진다.
   *
   * isLoggedIn 이 undefined 인 동안(확인 중)에는 막지 않는다 - 회원인데 잠깐
   * 로그인 안내가 스쳤다 사라지는 깜빡임을 만들지 않기 위함이다.
   */
  if (isLoggedIn === false) {
    return (
      <JoinCardFrame
        cardRef={cardRef}
        title={step.title}
        progressPosition={progressPosition}
        progressAriaLabel="부가서비스 가입 진행 상황"
        isPrevDisabled
        onPrev={handlePrev}
      >
        <JoinSignupNotice
          message={
            <>
              부가서비스 신청은 회원만 할 수 있어요.
              <br />
              카카오로 로그인하면 이어서 진행할 수 있어요.
            </>
          }
        >
          {renderSignup?.()}
        </JoinSignupNotice>
      </JoinCardFrame>
    );
  }

  // 신청 확인 자리에는 상황에 따라 셋 중 하나가 온다 -
  // 회원가입 안내(비회원) > 처리 중 > 평소의 신청 확인
  const confirmBody = submission.isSignupRequired ? (
    <JoinSignupNotice
      message={
        <>
          부가서비스 신청은 회원만 할 수 있어요.
          <br />
          카카오로 가입하고 이어서 진행해 주세요.
        </>
      }
      onPrev={submission.closeSignupNotice}
    >
      {renderSignup?.()}
    </JoinSignupNotice>
  ) : submission.isSubmitting ? (
    <PaymentLoading />
  ) : (
    <AddOnConfirmStep
      addOn={addOn}
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
      progressAriaLabel="부가서비스 가입 진행 상황"
      isPrevDisabled={
        prevStepIndex === -1 || submission.isSubmitting || isCompleted
      }
      onPrev={handlePrev}
    >
      {step.id === 'addOn' && (
        <AddOnConfirmDetailStep
          addOn={addOn}
          submitLabel={submitLabel}
          onNext={goNext}
        />
      )}

      {step.id === 'terms' && (
        <TermsStep
          terms={ADD_ON_JOIN_TERMS}
          submitLabel={submitLabel}
          agreedIds={agreedTermIds}
          onAgreedIdsChange={setAgreedTermIds}
          onNext={goNext}
        />
      )}

      {step.id === 'confirm' && confirmBody}
    </JoinCardFrame>
  );
}
