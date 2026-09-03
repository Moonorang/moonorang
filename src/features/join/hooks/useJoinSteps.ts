'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import type { JoinStep } from '@/features/join/data/steps';
import {
  findNextStepIndex,
  findPrevStepIndex,
  getProgressPosition,
} from '@/features/join/lib/steps';

interface UseJoinStepsParams {
  /** 이 절차의 전체 단계 (data/steps.ts) */
  steps: readonly JoinStep[];
  /** CARD-046: 저장해둔 진행 상태가 있으면 그 자리에서 시작한다 */
  initialStepIndex?: number;
}

/**
 * CARD-031/032/040: 가입 절차의 단계 이동.
 * 요금제·부가서비스가 같은 규칙으로 움직여서(다음/이전, 진행 표시줄, 단계마다
 * 카드 머리 맞추기) 종류별 카드가 이 훅을 함께 쓴다. 다른 것은 steps 뿐이다.
 */
export function useJoinSteps({ steps, initialStepIndex }: UseJoinStepsParams) {
  // 카드가 붙는 시점에는 대화 복구가 이미 끝나 있어서 첫 값으로 받아도 늦지 않다
  const [stepIndex, setStepIndex] = useState(initialStepIndex ?? 0);

  const cardRef = useRef<HTMLDivElement>(null);
  // 카드가 처음 붙는 순간은 ChatRoom 이 최하단으로 끌어내리는 시점이라 건드리지 않는다
  const isFirstRenderRef = useRef(true);

  const step = steps[stepIndex];
  const nextStepIndex = findNextStepIndex(steps, stepIndex);
  const prevStepIndex = findPrevStepIndex(steps, stepIndex);
  // 진행 표시줄에 그릴 위치 - 이어가기용 progress 와는 다른 값이다
  const progressPosition = getProgressPosition(steps, stepIndex);

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

  const goNext = () => {
    // 뒤에 남은 화면이 없으면 절차를 마친 것으로 본다
    if (nextStepIndex === -1) return;

    setStepIndex(nextStepIndex);
  };

  const goPrev = () => {
    setStepIndex(prevStepIndex);
  };

  return {
    stepIndex,
    step,
    /** CARD-040: 되돌아갈 곳이 없으면 -1 - 이전 버튼을 잠그는 기준 */
    prevStepIndex,
    progressPosition,
    cardRef,
    goNext,
    goPrev,
  };
}
