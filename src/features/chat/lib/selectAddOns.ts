import type { AddOn } from '@/entities/addOn/types';

export interface ScoredAddOn {
  addOn: AddOn;
  rank: number;
  /** entities/addOn/server의 getAddOnAdoptionRates 실 데이터. 없으면(아무도 안 씀) 0 */
  adoptionRate: number;
}

// 화면 카드가 감당할 상한 - 내부 스크롤이 있어도 무한정 늘어나진 않게 방어적으로 잡는다.
const MAX_ADD_ON_RESULTS = 6;

function normalizeText(addOn: AddOn): string {
  return [addOn.title, addOn.subTitle, addOn.description?.guide, ...(addOn.description?.features ?? [])]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase();
}

function matchesInterest(addOn: AddOn, interests: string[]): boolean {
  const normalized = normalizeText(addOn);
  return interests.some((interest) => {
    const trimmed = interest.trim().toLowerCase();
    return trimmed.length > 0 && normalized.includes(trimmed);
  });
}

/**
 * CARD-001과 같은 원칙 - 어떤 부가서비스를 보여줄지는 LLM이 아니라 이 순수 함수가
 * 정한다. LLM(recommend_addons)은 "지금 부가서비스를 추천해달라"는 신호만 준다.
 *
 * 관심사가 있으면 제목·부제·설명(guide/features) 텍스트에 그 키워드가 실제로 있는
 * 부가서비스만 추린다. 관심사가 없거나 하나도 안 맞으면(예: "부가서비스 뭐 있어요?"
 * 처럼 막연히 물었을 때) 채택률이 높은 순 - 즉 "다른 고객님들이 많이 쓰는" 순으로
 * 기본값을 보여준다. 어느 경우든 정렬 축은 채택률(adoptionRate) 내림차순이라,
 * 같은 입력엔 항상 같은 결과가 나온다(NFR-005).
 */
export function selectRecommendedAddOns(
  addOns: AddOn[],
  interests: string[] | undefined,
  adoptionRates: Map<number, number>,
): ScoredAddOn[] {
  const withRate = (addOn: AddOn) => adoptionRates.get(addOn.id) ?? 0;

  const matched = interests?.length
    ? addOns.filter((addOn) => matchesInterest(addOn, interests))
    : [];

  const pool = matched.length > 0 ? matched : addOns;

  return pool
    .slice()
    .sort((a, b) => withRate(b) - withRate(a))
    .slice(0, MAX_ADD_ON_RESULTS)
    .map((addOn, index) => ({
      addOn,
      rank: index + 1,
      adoptionRate: withRate(addOn),
    }));
}
