import { JOIN_TERMS } from '@/features/join/data/terms';

/** 필수 약관에 모두 동의했는지 - 다음 단계로 넘어갈 수 있는 조건 */
export function hasAgreedRequiredTerms(agreedIds: string[]): boolean {
  return JOIN_TERMS.filter((term) => term.isRequired).every((term) =>
    agreedIds.includes(term.id),
  );
}
