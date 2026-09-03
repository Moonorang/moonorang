import type { JoinKind } from '@/entities/join/types';

/**
 * 가입 절차를 걸 수 있는 상품 종류 전부.
 *
 * 타입(JoinKind)만으로는 런타임에 확인할 수 없는 자리가 있어서 값으로도 둔다 -
 * 브라우저 저장분이나 요청 바디처럼 밖에서 들어온 문자열을 가려낼 때 쓴다.
 * 종류가 늘면 JoinKind 와 이 배열을 함께 고쳐야 한다 - 한 곳에 모아둔 이유다.
 */
export const JOIN_KINDS: JoinKind[] = ['plan', 'addOn', 'subscription'];

/** 밖에서 들어온 값이 아는 종류인지 */
export function isJoinKind(value: unknown): value is JoinKind {
  return JOIN_KINDS.includes(value as JoinKind);
}
