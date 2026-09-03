'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import CardStep from '@/features/join/components/CardStep';
import ConfirmStep from '@/features/join/components/ConfirmStep';
import IdentityStep from '@/features/join/components/IdentityStep';
import JoinAlreadyNotice from '@/features/join/components/JoinAlreadyNotice';
import JoinCardFrame from '@/features/join/components/JoinCardFrame';
import JoinCheckingNotice from '@/features/join/components/JoinCheckingNotice';
import JoinSignupNotice from '@/features/join/components/JoinSignupNotice';
import PaymentLoading from '@/features/join/components/PaymentLoading';
import PlanConfirmStep from '@/features/join/components/PlanConfirmStep';
import TermsStep from '@/features/join/components/TermsStep';
import { PLAN_JOIN_STEPS } from '@/features/join/data/steps';
import { PLAN_JOIN_TERMS } from '@/features/join/data/terms';
import { useJoinAvailability } from '@/features/join/hooks/useJoinAvailability';
import { useJoinSteps } from '@/features/join/hooks/useJoinSteps';
import { useJoinSubmission } from '@/features/join/hooks/useJoinSubmission';
import { getBirthFromRrn, getGenderFromRrnCode } from '@/features/join/lib/rrn';
import { completeJoin } from '@/features/join/server/actions';
import type { CardValues } from '@/features/join/lib/cardSchema';
import type { IdentityValues } from '@/features/join/lib/identitySchema';

import type { JoinProgress } from '@/entities/join/types';
import type { Plan } from '@/entities/plan/types';
import { saveSignupPrefill } from '@/entities/user/lib/signupPrefill';
import type { Gender } from '@/entities/user/types';

/** 본인 확인에 아직 아무것도 입력하지 않은 상태 */
const EMPTY_IDENTITY: IdentityValues = {
  name: '',
  rrnFront: '',
  rrnGenderCode: '',
  issuedDate: '',
  mobileNum: '',
};

/** 카드 등록에 아직 아무것도 입력하지 않은 상태 */
const EMPTY_CARD: CardValues = {
  issuer: '',
  cardNumber: '',
  expiry: '',
};

interface JoinFlowCardProps {
  /** 가입할 요금제 */
  plan: Plan;
  /**
   * CARD-044: 회원인지. 비회원은 결제 대신 카카오 회원가입부터 거친다.
   */
  isLoggedIn?: boolean;
  /**
   * 비회원에게 보여줄 카카오 회원가입 버튼.
   * features 끼리 직접 참조하지 않으려고 슬롯으로 받는다.
   */
  renderSignup?: () => ReactNode;
  /**
   * CARD-043: 결제가 끝났는지. 화면을 떠났다 돌아와도 두 번 결제되지 않도록
   * 이 값은 카드가 아니라 대화 쪽(joinBlocks)이 들고 있다.
   */
  isCompleted?: boolean;
  /** 결제가 끝난 순간 한 번 불린다 - 가입 결과는 대화에 새 메시지로 남는다 */
  onComplete?: () => void;
  /**
   * CARD-046: 지난번에 어디까지 밟았는지. 회원가입 하러 나갔다 돌아오면 화면이
   * 통째로 새로 뜨므로, 이 값이 없으면 늘 첫 단계부터 다시 시작하게 된다.
   */
  progress?: JoinProgress;
  /** 진행 상태가 달라질 때마다 불린다 - 대화 쪽이 받아서 함께 저장한다 */
  onProgressChange?: (progress: JoinProgress) => void;
}

/**
 * CARD-029 ~ CARD-032: 대화 안에서 단계별로 진행하는 요금제 가입 카드.
 * 단계가 넘어가도 새 메시지를 쌓지 않고 이 카드 한 장의 내용만 바뀐다 -
 * 가입은 한 번의 흐름이지 여러 번의 대화가 아니기 때문이다.
 *
 * 단계별 입력값을 각 단계가 아니라 여기서 들고 있는 이유는 CARD-040 때문이다.
 * 이전 단계로 돌아가면 그 단계 컴포넌트는 사라지므로, 값을 카드가 갖고 있어야
 * 되돌아가서 고치고 다시 올 수 있다.
 */
export default function JoinFlowCard({
  plan,
  isLoggedIn = false,
  renderSignup,
  isCompleted = false,
  onComplete,
  progress,
  onProgressChange,
}: JoinFlowCardProps) {
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
    steps: PLAN_JOIN_STEPS,
    initialStepIndex: progress?.stepIndex,
  });

  const [agreedTermIds, setAgreedTermIds] = useState<string[]>(
    progress?.agreedTermIds ?? [],
  );
  // 이름·주민등록번호·카드번호는 저장하지 않아서 돌아오면 비어 있다.
  // 되돌아가 고칠 때만 쓰이는 값이라 비어 있어도 절차는 이어진다.
  const [identity, setIdentity] = useState<IdentityValues>(EMPTY_IDENTITY);
  const [card, setCard] = useState<CardValues>(EMPTY_CARD);
  // 본인 확인에서 뽑아낸 성별과 생년월일. 주민등록번호 자체와 달리 이 결과값들은
  // 저장해두는데, 가입을 마칠 때 회원 정보에 남겨야 하기 때문이다.
  const [gender, setGender] = useState<Gender | null>(progress?.gender ?? null);
  const [birth, setBirth] = useState<string | null>(progress?.birth ?? null);
  // 첫 그리기에서는 방금 복구한 값을 그대로 되돌려 보내는 셈이라 알리지 않는다
  const isFirstProgressRef = useRef(true);

  // CARD-030: 회원에게는 '변경'을 연결하는데, 지금 쓰는 요금제로는 바꿀 것이 없다
  const availability = useJoinAvailability({
    kind: 'plan',
    itemId: plan.id,
    isLoggedIn,
    isCompleted,
  });

  /**
   * CARD-043/045: 결제하기부터 가입 확정까지. 여기서 현재 이용 요금제가 바뀐다 -
   * 저장이 실패하면 훅이 결제 정보 화면으로 되돌리고 사유를 보여주므로,
   * 화면과 회원 정보가 어긋난 채로 남지 않는다.
   */
  const submission = useJoinSubmission({
    target: { kind: 'plan', itemId: plan.id },
    isLoggedIn,
    isCompleted,
    errorFallbackMessage: '가입을 완료하지 못했어요. 다시 시도해 주세요.',
    onSubmit: () =>
      completeJoin({
        planId: plan.id,
        gender: gender ?? undefined,
        birth: birth ?? undefined,
      }),
    // AUTH-008: 회원가입 추가 정보 화면이 방금 입력한 값을 초기값으로 쓰게 넘겨둔다.
    // 이어가기(CARD-046)로 돌아온 경우엔 이름·연락처가 비어 있는데, 성별·생년월일은
    // 진행 상태에 남아 있어 여전히 넘길 것이 있다 - 그래서 이름 유무로 막지 않는다.
    onBeforeSignup: () =>
      saveSignupPrefill({
        name: identity.name,
        mobileNum: identity.mobileNum,
        gender: gender ?? undefined,
        birth: birth ?? undefined,
      }),
    onComplete,
  });

  // 2. 부수 효과
  // CARD-046: 어디까지 왔는지가 달라질 때마다 대화 쪽에 알려 함께 저장하게 한다.
  // onProgressChange 는 매 렌더 새로 만들어지지만, 받는 쪽이 같은 값이면 저장을
  // 건너뛰므로 이 효과가 다시 도는 일은 없다.
  useEffect(() => {
    if (isFirstProgressRef.current) {
      isFirstProgressRef.current = false;
      return;
    }

    onProgressChange?.({
      stepIndex,
      agreedTermIds,
      gender: gender ?? undefined,
      birth: birth ?? undefined,
    });
  }, [stepIndex, agreedTermIds, gender, birth, onProgressChange]);

  // 3. 이벤트 핸들러
  const handlePrev = () => {
    // 결제하기를 물렀다는 뜻이므로 회원가입 안내를 접고 이어가기 표식도 거둔다
    submission.withdraw();
    goPrev();
  };

  const handleIdentityNext = (values: IdentityValues) => {
    setIdentity(values);
    // 주민등록번호는 여기서 성별·생년월일로 한 번 풀어내고 그 결과만 들고 간다
    setGender(getGenderFromRrnCode(values.rrnGenderCode));
    setBirth(getBirthFromRrn(values.rrnFront, values.rrnGenderCode));
    goNext();
  };

  const handleCardNext = (values: CardValues) => {
    setCard(values);
    goNext();
  };

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  /*
   * 이미 쓰고 있는 요금제이거나 아직 확인 중이면 절차 대신 이 안내가 카드를 채운다.
   * 비회원은 여기 걸리지 않는다 - 요금제는 비회원도 절차를 밟고 마지막에 회원가입으로
   * 가는 흐름이라(CARD-044), 이용 중 여부를 물을 상대가 없다.
   */
  if (availability !== 'available') {
    return (
      <JoinCardFrame
        cardRef={cardRef}
        title={step.title}
        progressPosition={progressPosition}
        progressAriaLabel="요금제 가입 진행 상황"
        isPrevDisabled
        onPrev={handlePrev}
      >
        {availability === 'checking' ? (
          <JoinCheckingNotice />
        ) : (
          <JoinAlreadyNotice
            message={
              <>
                이미 이용 중인 요금제예요.
                <br />
                다른 요금제를 찾아보시겠어요?
              </>
            }
          />
        )}
      </JoinCardFrame>
    );
  }

  // 결제 정보 자리에는 상황에 따라 셋 중 하나가 온다 -
  // 회원가입 안내(비회원) > 결제 처리 중 > 평소의 결제 정보
  const confirmBody = submission.isSignupRequired ? (
    <JoinSignupNotice
      message={
        <>
          요금제 가입은 회원만 할 수 있어요.
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
    <ConfirmStep
      plan={plan}
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
      progressAriaLabel="요금제 가입 진행 상황"
      isPrevDisabled={
        prevStepIndex === -1 || submission.isSubmitting || isCompleted
      }
      onPrev={handlePrev}
    >
      {step.id === 'plan' && (
        <PlanConfirmStep
          plan={plan}
          submitLabel={submitLabel}
          onNext={goNext}
        />
      )}

      {step.id === 'terms' && (
        <TermsStep
          terms={PLAN_JOIN_TERMS}
          submitLabel={submitLabel}
          agreedIds={agreedTermIds}
          onAgreedIdsChange={setAgreedTermIds}
          onNext={goNext}
        />
      )}

      {step.id === 'identity' && (
        <IdentityStep
          submitLabel={submitLabel}
          defaultValues={identity}
          onNext={handleIdentityNext}
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
