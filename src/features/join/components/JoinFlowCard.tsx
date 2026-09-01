'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { ChevronLeft } from 'lucide-react';

import StepProgress from '@/shared/ui/StepProgress';

import CardStep from '@/features/join/components/CardStep';
import ConfirmStep from '@/features/join/components/ConfirmStep';
import IdentityStep from '@/features/join/components/IdentityStep';
import PlanConfirmStep from '@/features/join/components/PlanConfirmStep';
import TermsStep from '@/features/join/components/TermsStep';
import { JOIN_STEPS } from '@/features/join/data/steps';
import {
  findNextStepIndex,
  findPrevStepIndex,
  getProgressPosition,
} from '@/features/join/lib/steps';
import type { CardValues } from '@/features/join/lib/cardSchema';
import type { IdentityValues } from '@/features/join/lib/identitySchema';

import type { Plan } from '@/entities/plan/types';

/** 본인 확인에 아직 아무것도 입력하지 않은 상태 */
const EMPTY_IDENTITY: IdentityValues = {
  name: '',
  rrnFront: '',
  rrnBack: '',
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
export default function JoinFlowCard({ plan }: JoinFlowCardProps) {
  // 1. 상태 및 훅
  const [stepIndex, setStepIndex] = useState(0);
  const [agreedTermIds, setAgreedTermIds] = useState<string[]>([]);
  const [identity, setIdentity] = useState<IdentityValues>(EMPTY_IDENTITY);
  const [card, setCard] = useState<CardValues>(EMPTY_CARD);

  const step = JOIN_STEPS[stepIndex];
  const nextStepIndex = findNextStepIndex(stepIndex);
  const prevStepIndex = findPrevStepIndex(stepIndex);
  const progress = getProgressPosition(stepIndex);

  const cardRef = useRef<HTMLDivElement>(null);
  // 카드가 처음 붙는 순간은 ChatRoom 이 최하단으로 끌어내리는 시점이라 건드리지 않는다
  const isFirstRenderRef = useRef(true);

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

  // 3. 이벤트 핸들러
  const handleNext = () => {
    // 뒤에 남은 화면이 없으면 절차를 마친 것으로 본다
    if (nextStepIndex === -1) return;

    setStepIndex(nextStepIndex);
  };

  const handlePrev = () => {
    setStepIndex(prevStepIndex);
  };

  const handleIdentityNext = (values: IdentityValues) => {
    setIdentity(values);
    handleNext();
  };

  const handleCardNext = (values: CardValues) => {
    setCard(values);
    handleNext();
  };

  // 4. 렌더링
  const submitLabel = step.submitLabel;

  // 폭·여백은 대화에 나란히 서는 PlanCard 와 같은 값으로 맞춘다.
  // scroll-mt 는 고정 헤더 높이만큼 - 없으면 단계 이동 때 카드 머리가 헤더에 가린다
  return (
    <div
      ref={cardRef}
      className="flex w-[80%] scroll-mt-(--height-header) flex-col rounded-md bg-background-default p-4"
    >
      <div className="flex items-center gap-1">
        {/*
          CARD-040: 첫 단계에서는 돌아갈 곳이 없어 잠가둔다.
          Header·QuestionCard 의 이전 버튼과 같은 방식으로 그린다
        */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevStepIndex === -1}
          aria-label="이전 단계로 이동"
          className="shrink-0 cursor-pointer text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>

        <h3 className="text-14 font-medium text-text-primary">{step.title}</h3>
      </div>

      {/* 상세 확인은 절차가 시작되기 전이라 표시줄을 안 그린다 */}
      {progress && (
        <div className="mt-3">
          <StepProgress
            total={progress.total}
            currentIndex={progress.currentIndex}
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

      {step.id === 'confirm' && (
        <ConfirmStep
          plan={plan}
          submitLabel={submitLabel}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
