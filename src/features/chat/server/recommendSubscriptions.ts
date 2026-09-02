import type { Subscription } from '@/entities/subscription/types';
import { selectRecommendedSubscriptions } from '@/features/chat/lib/selectSubscriptions';
import type { SSESend } from '@/features/chat/lib/sse';
import type { ChatKeywords, SubscriptionRecommendation } from '@/features/chat/types';

/**
 * recommendAddOns.ts와 같은 패턴 - recommend_subscriptions가 트리거되면 실제
 * 선별(selectRecommendedSubscriptions, 순수 계산)을 수행하고 결과를 이벤트로 보낸다.
 */
export function runSubscriptionRecommendation(
  subscriptions: Subscription[],
  adoptionRates: Map<number, number>,
  keywords: ChatKeywords,
  send: SSESend,
): unknown {
  const scored = selectRecommendedSubscriptions(
    subscriptions,
    keywords.interests,
    adoptionRates,
  );

  const recommendations: SubscriptionRecommendation[] = scored.map((item) => ({
    subscription: item.subscription,
    rank: item.rank,
    adoptionRate: item.adoptionRate,
  }));

  send({
    event: 'subscriptionRecommendation',
    data: { subscriptions: recommendations },
  });

  return {
    subscriptions: recommendations.map((item) => ({
      rank: item.rank,
      name: item.subscription.name,
      baseMonthlyFee: item.subscription.baseMonthlyFee,
      discount: item.subscription.discount,
      highlight: item.subscription.highlight,
      adoptionRate: item.adoptionRate,
    })),
    matchedByInterest: Boolean(keywords.interests?.length),
  };
}
