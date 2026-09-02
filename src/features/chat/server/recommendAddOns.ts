import type { AddOn } from '@/entities/addOn/types';
import { selectRecommendedAddOns } from '@/features/chat/lib/selectAddOns';
import type { SSESend } from '@/features/chat/lib/sse';
import type { AddOnRecommendation, ChatKeywords } from '@/features/chat/types';

/**
 * recommend_addons가 트리거되면 실제 선별을 수행한다.
 *
 * CARD-001과 같은 원칙 - LLM은 "지금 부가서비스를 추천해달라"는 신호만 주고, 어떤
 * 부가서비스를 몇 위로 보여줄지는 selectRecommendedAddOns(순수 계산)가 정한다.
 *
 * addOnRecommendation 이벤트를 내보내고, 다음 턴(자연어 마무리 응답)의 tool 결과
 * 메시지에 넣을 요약값을 돌려준다.
 */
export function runAddOnRecommendation(
  addOns: AddOn[],
  adoptionRates: Map<number, number>,
  keywords: ChatKeywords,
  send: SSESend,
): unknown {
  const scored = selectRecommendedAddOns(addOns, keywords.interests, adoptionRates);

  const recommendations: AddOnRecommendation[] = scored.map((item) => ({
    addOn: item.addOn,
    rank: item.rank,
    adoptionRate: item.adoptionRate,
  }));

  send({ event: 'addOnRecommendation', data: { addOns: recommendations } });

  // 다음 턴에서 모델이 자연어로 마무리 발언을 할 때 참고할 사실 - 실제 DB 값.
  return {
    addOns: recommendations.map((item) => ({
      rank: item.rank,
      title: item.addOn.title,
      subTitle: item.addOn.subTitle,
      baseMonthlyRate: item.addOn.baseMonthlyRate,
      guide: item.addOn.description?.guide,
      adoptionRate: item.adoptionRate,
    })),
    // 관심사 매칭 없이 인기 순으로 대체됐는지 - 마무리 응답 문구 분기에 참고하라고 알려준다.
    matchedByInterest: Boolean(keywords.interests?.length),
  };
}
