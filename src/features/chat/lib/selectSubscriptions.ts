import { expandOttInterests } from '@/features/chat/lib/expandOttInterests';
import { rankByInterestThenRate } from '@/features/chat/lib/rankByInterest';
import type { Subscription } from '@/entities/subscription/types';

export interface ScoredSubscription {
  subscription: Subscription;
  rank: number;
  /** entities/subscription/server의 getSubscriptionAdoptionRates 실 데이터. 없으면 0 */
  adoptionRate: number;
}

const MAX_SUBSCRIPTION_RESULTS = 6;

function toSearchableText(subscription: Subscription): string {
  return [
    subscription.name,
    subscription.highlight,
    subscription.description?.subTitle,
    ...(subscription.description?.features ?? []),
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

/**
 * selectAddOns.ts와 같은 원칙(CARD-001) - LLM(recommend_subscriptions)은 신호만
 * 주고, 실제 선별은 이 순수 함수가 한다. 관심사에 맞는 구독 상품을 목록 맨 위로
 * 올리고, 안 맞는 것도 빼지 않고 뒤에 이어붙인다 - 같은 그룹 안에서는 채택률순.
 * "OTT"처럼 카테고리로만 말한 관심사는 expandOttInterests가 구체적인 브랜드명으로
 * 풀어준 뒤 매칭한다 - 안 그러면 "OTT"라는 글자 자체는 상품명에 없어서 아무것도
 * 못 찾고 인기순(가격순 타이브레이크)으로만 나가버린다.
 */
export function selectRecommendedSubscriptions(
  subscriptions: Subscription[],
  interests: string[] | undefined,
  adoptionRates: Map<number, number>,
): ScoredSubscription[] {
  const withRate = (subscription: Subscription) =>
    adoptionRates.get(subscription.id) ?? 0;

  return rankByInterestThenRate(
    subscriptions,
    expandOttInterests(interests),
    toSearchableText,
    withRate,
    MAX_SUBSCRIPTION_RESULTS,
  ).map((subscription, index) => ({
    subscription,
    rank: index + 1,
    adoptionRate: withRate(subscription),
  }));
}
