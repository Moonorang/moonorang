import type { JoinTerm } from '@/features/join/data/terms';

/** 필수 약관에 모두 동의했는지 - 다음 단계로 넘어갈 수 있는 조건 */
export function hasAgreedRequiredTerms(
  terms: JoinTerm[],
  agreedIds: string[],
): boolean {
  return terms
    .filter((term) => term.isRequired)
    .every((term) => agreedIds.includes(term.id));
}
