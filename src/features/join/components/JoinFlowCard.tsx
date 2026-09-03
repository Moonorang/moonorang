'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronLeft } from 'lucide-react';

import StepProgress from '@/shared/ui/StepProgress';

import CardStep from '@/features/join/components/CardStep';
import ConfirmStep from '@/features/join/components/ConfirmStep';
import IdentityStep from '@/features/join/components/IdentityStep';
import JoinSignupNotice from '@/features/join/components/JoinSignupNotice';
import PaymentLoading from '@/features/join/components/PaymentLoading';
import PlanConfirmStep from '@/features/join/components/PlanConfirmStep';
import TermsStep from '@/features/join/components/TermsStep';
import { PAYMENT_DELAY_MS } from '@/features/join/data/complete';
import { JOIN_STEPS } from '@/features/join/data/steps';
import { getBirthFromRrn, getGenderFromRrnCode } from '@/features/join/lib/rrn';
import {
  findNextStepIndex,
  findPrevStepIndex,
  getProgressPosition,
} from '@/features/join/lib/steps';
import { completeJoin } from '@/features/join/server/actions';
import type { CardValues } from '@/features/join/lib/cardSchema';
import type { IdentityValues } from '@/features/join/lib/identitySchema';

import type { PlanJoinProgress } from '@/entities/planJoin/types';
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
  progress?: PlanJoinProgress;
  /** 진행 상태가 달라질 때마다 불린다 - 대화 쪽이 받아서 함께 저장한다 */
  onProgressChange?: (progress: PlanJoinProgress) => void;
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
  // CARD-046: 저장해둔 진행 상태가 있으면 그 자리에서 시작한다.
  // 카드가 붙는 시점에는 대화 복구가 이미 끝나 있어서 첫 값으로 받아도 늦지 않다.
  const [stepIndex, setStepIndex] = useState(progress?.stepIndex ?? 0);
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
  // CARD-043: 결제하기를 누른 뒤 가입 결과가 대화에 나오기 전까지의 처리 중 상태
  const [isPaying, setIsPaying] = useState(false);
  // CARD-044: 비회원이 결제하기를 눌러 회원가입 안내로 갈아탄 상태
  const [isSignupRequired, setIsSignupRequired] = useState(false);
  // COMMON-002: 가입 정보를 저장하지 못했을 때 결제 정보 화면에 남기는 사유
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const step = JOIN_STEPS[stepIndex];
  const nextStepIndex = findNextStepIndex(stepIndex);
  const prevStepIndex = findPrevStepIndex(stepIndex);
  // 진행 표시줄에 그릴 위치 - 이어가기용 progress(props) 와는 다른 값이다
  const progressPosition = getProgressPosition(stepIndex);

  const cardRef = useRef<HTMLDivElement>(null);
  // 카드가 처음 붙는 순간은 ChatRoom 이 최하단으로 끌어내리는 시점이라 건드리지 않는다
  const isFirstRenderRef = useRef(true);
  const payingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 첫 그리기에서는 방금 복구한 값을 그대로 되돌려 보내는 셈이라 알리지 않는다
  const isFirstProgressRef = useRef(true);

  // 2. 부수 효과
  // 단계마다 카드 높이가 크게 달라서(상세 카드 ↔ 약관), 스크롤 위치를 그대로 두면
  // 다음으로 갈 땐 내용이 줄어든 만큼 화면이 튀고, 이전으로 돌아오면 늘어난 만큼
  // 위쪽이 잘린 채로 보인다. 단계가 바뀔 때마다 카드 머리를 화면 위에 맞춰준다.
  // useEffect 가 아니라 useLayoutEffect 인 이유는 그리기 전에 옮겨야 튀는 순간이
  // 눈에 안 보이기 때문이다.
  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    cardRef.current?.scrollIntoView({ block: 'start' });
  }, [stepIndex]);

  // 결제 중에 카드가 사라지면(대화 초기화 등) 타이머만 남아 없는 화면을 바꾸려 든다
  useEffect(() => {
    return () => {
      if (payingTimerRef.current) clearTimeout(payingTimerRef.current);
    };
  }, []);

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
  const handleNext = () => {
    // 뒤에 남은 화면이 없으면 절차를 마친 것으로 본다
    if (nextStepIndex === -1) return;

    setStepIndex(nextStepIndex);
  };

  const handlePrev = () => {
    // 단계를 옮기면 회원가입 안내는 접는다 - 다시 오면 결제 정보부터 본다
    setIsSignupRequired(false);
    setStepIndex(prevStepIndex);
  };

  const handleIdentityNext = (values: IdentityValues) => {
    setIdentity(values);
    // 주민등록번호는 여기서 성별·생년월일로 한 번 풀어내고 그 결과만 들고 간다
    setGender(getGenderFromRrnCode(values.rrnGenderCode));
    setBirth(getBirthFromRrn(values.rrnFront, values.rrnGenderCode));
    handleNext();
  };

  const handleCardNext = (values: CardValues) => {
    setCard(values);
    handleNext();
  };

  /**
   * 결제 처리가 끝난 뒤 - 가입을 회원 정보에 반영하고 결과를 대화로 넘긴다.
   *
   * CARD-045: 여기서 현재 이용 요금제가 바뀐다. 저장이 실패했는데도 가입 완료를
   * 알리면 화면과 회원 정보가 어긋난 채로 남으므로, 실패하면 결제 정보 화면으로
   * 되돌리고 사유를 보여준다 - 다시 시도는 결제하기를 한 번 더 누르면 된다.
   */
  const finishPayment = async () => {
    const { errorMessage } = await completeJoin({
      planId: plan.id,
      gender: gender ?? undefined,
      birth: birth ?? undefined,
    });

    setIsPaying(false);

    if (errorMessage) {
      setPaymentError(errorMessage);
      return;
    }

    onComplete?.();
  };

  /**
   * CARD-043: 결제하기. 실제 결제 연동이 없어서 잠깐 처리하는 척하다가, 끝나면
   * 결과를 카드가 아니라 대화에 새 메시지로 넘긴다 - 가입이 끝난 뒤의 이야기는
   * 절차의 한 단계가 아니라 무너가 건네는 다음 말이기 때문이다.
   */
  const handlePayment = () => {
    if (isPaying || isCompleted) return;

    setPaymentError(null);

    // CARD-044: 가입은 회원만 할 수 있어서, 비회원은 결제 대신 회원가입부터 거친다.
    // 카카오를 다녀와도 CARD-046 진행 상태 덕에 이 자리에서 다시 시작한다.
    if (!isLoggedIn) {
      // AUTH-008: 회원가입 추가 정보 화면이 방금 입력한 값을 초기값으로 쓰게 넘겨둔다.
      // 이어가기(CARD-046)로 돌아온 경우엔 입력값이 없으니 덮어쓰지 않는다.
      if (identity.name) {
        saveSignupPrefill({
          name: identity.name,
          mobileNum: identity.mobileNum,
        });
      }

      setIsSignupRequired(true);
      return;
    }

    setIsPaying(true);
    payingTimerRef.current = setTimeout(
      () => void finishPayment(),
      PAYMENT_DELAY_MS,
    );
  };

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  // 결제 정보 자리에는 상황에 따라 셋 중 하나가 온다 -
  // 회원가입 안내(비회원) > 결제 처리 중 > 평소의 결제 정보
  const confirmBody = isSignupRequired ? (
    <JoinSignupNotice onPrev={() => setIsSignupRequired(false)}>
      {renderSignup?.()}
    </JoinSignupNotice>
  ) : isPaying ? (
    <PaymentLoading />
  ) : (
    <ConfirmStep
      plan={plan}
      submitLabel={submitLabel}
      isCompleted={isCompleted}
      errorMessage={paymentError}
      onPrev={handlePrev}
      onNext={handlePayment}
    />
  );

  // 폭·여백은 대화에 나란히 서는 PlanCard 와 같은 값으로 맞춘다.
  // scroll-mt 는 고정 헤더 높이만큼 - 없으면 단계 이동 때 카드 머리가 헤더에 가린다
  return (
    <div
      ref={cardRef}
      className="flex w-[80%] scroll-mt-(--height-header) flex-col rounded-md bg-background-default p-4"
    >
      <div className="flex items-center gap-1">
        {/*
          CARD-040: 첫 단계에서는 돌아갈 곳이 없어 잠가둔다. 결제 중이거나 이미
          가입을 마친 뒤에도 되돌릴 것이 없어 같이 잠근다.
          Header·QuestionCard 의 이전 버튼과 같은 방식으로 그린다
        */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevStepIndex === -1 || isPaying || isCompleted}
          aria-label="이전 단계로 이동"
          className="shrink-0 cursor-pointer text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>

        <h3 className="text-14 font-medium text-text-primary">{step.title}</h3>
      </div>

      {/* 상세 확인은 절차가 시작되기 전이라 표시줄을 안 그린다 */}
      {progressPosition && (
        <div className="mt-3">
          <StepProgress
            total={progressPosition.total}
            currentIndex={progressPosition.currentIndex}
            ariaLabel="요금제 가입 진행 상황"
          />
        </div>
      )}

      {step.id === 'plan' && (
        <PlanConfirmStep
          plan={plan}
          submitLabel={submitLabel}
          onNext={handleNext}
        />
      )}

      {step.id === 'terms' && (
        <TermsStep
          submitLabel={submitLabel}
          agreedIds={agreedTermIds}
          onAgreedIdsChange={setAgreedTermIds}
          onNext={handleNext}
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
    </div>
  );
}
