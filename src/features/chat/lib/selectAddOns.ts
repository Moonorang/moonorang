import { expandOttInterests } from '@/features/chat/lib/expandOttInterests';
import { rankByInterestThenRate } from '@/features/chat/lib/rankByInterest';
import type { AddOn } from '@/entities/addOn/types';

export interface ScoredAddOn {
  addOn: AddOn;
  rank: number;
  /** entities/addOn/server의 getAddOnAdoptionRates 실 데이터. 없으면(아무도 안 씀) 0 */
  adoptionRate: number;
}

// 화면 카드가 감당할 상한 - 내부 스크롤이 있어도 무한정 늘어나진 않게 방어적으로 잡는다.
const MAX_ADD_ON_RESULTS = 6;

function toSearchableText(addOn: AddOn): string {
  return [addOn.title, addOn.subTitle, addOn.description?.guide, ...(addOn.description?.features ?? [])]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

/**
 * CARD-001과 같은 원칙 - 어떤 부가서비스를 보여줄지는 LLM이 아니라 이 순수 함수가
 * 정한다. LLM(recommend_addons)은 "지금 부가서비스를 추천해달라"는 신호만 준다.
 *
 * 관심사와 맞는(제목·부제·설명 텍스트에 그 키워드가 실제로 있는) 부가서비스를 목록
 * 맨 위로 올리고, 안 맞는 것도 빼지 않고 뒤에 이어붙인다 - 같은 그룹 안에서는
 * 채택률(다른 고객님들이 많이 쓰는 순) 내림차순. 관심사가 아예 없으면 처음부터
 * 채택률순 전체 목록이 된다. rankByInterestThenRate가 정렬을 맡는다(NFR-005 결정론).
 */
export function selectRecommendedAddOns(
  addOns: AddOn[],
  interests: string[] | undefined,
  adoptionRates: Map<number, number>,
): ScoredAddOn[] {
  const withRate = (addOn: AddOn) => adoptionRates.get(addOn.id) ?? 0;

  return rankByInterestThenRate(
    addOns,
    expandOttInterests(interests),
    toSearchableText,
    withRate,
    MAX_ADD_ON_RESULTS,
  ).map((addOn, index) => ({
    addOn,
    rank: index + 1,
    adoptionRate: withRate(addOn),
  }));
}
