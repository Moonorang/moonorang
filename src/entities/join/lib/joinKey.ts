import type { JoinTarget } from '@/entities/join/types';

/**
 * 가입 카드 한 장을 배열에서 찾을 때 쓰는 키.
 *
 * kind 와 itemId 를 따로 비교하면 조건이 두 개로 늘어 빠뜨리기 쉬운데, 이 값을
 * 거치면 "plan:3" 처럼 문자열 하나가 되어 Set/Map 에도 그대로 넣을 수 있다.
 */
export function getJoinKey({ kind, itemId }: JoinTarget): string {
  return `${kind}:${itemId}`;
}

/** 두 가입 카드가 같은 상품을 가리키는지 */
export function isSameJoinTarget(a: JoinTarget, b: JoinTarget): boolean {
  return a.kind === b.kind && a.itemId === b.itemId;
}
