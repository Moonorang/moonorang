import { JOIN_STEPS } from '@/features/join/data/steps';

/**
 * from 에서 direction 쪽으로 화면이 있는 가장 가까운 단계.
 * 화면이 아직 없는 단계는 지나치고, 더 갈 곳이 없으면 -1 을 준다.
 */
function findStepIndex(from: number, direction: 1 | -1): number {
  for (
    let index = from + direction;
    index >= 0 && index < JOIN_STEPS.length;
    index += direction
  ) {
    if (JOIN_STEPS[index].hasScreen) return index;
  }

  return -1;
}

/** 다음으로 넘어갈 단계. 남은 단계가 없으면 -1 */
export function findNextStepIndex(from: number): number {
  return findStepIndex(from, 1);
}

/** CARD-040: 되돌아가 고칠 수 있는 이전 단계. 없으면 -1 */
export function findPrevStepIndex(from: number): number {
  return findStepIndex(from, -1);
}

export interface StepProgressPosition {
  /** 진행 표시줄에 그릴 칸 수 */
  total: number;
  /** 그중 지금 몇 번째인지 */
  currentIndex: number;
}

/**
 * CARD-032: 진행 표시줄에 쓸 위치.
 * 표시 대상이 아닌 단계(상세 확인)면 null - 그때는 표시줄을 아예 그리지 않는다.
 */
export function getProgressPosition(from: number): StepProgressPosition | null {
  const progressSteps = JOIN_STEPS.filter((step) => step.hasProgress);
  const currentIndex = progressSteps.findIndex(
    (step) => step.id === JOIN_STEPS[from].id,
  );

  if (currentIndex === -1) return null;

  return { total: progressSteps.length, currentIndex };
}
