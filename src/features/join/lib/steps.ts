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
