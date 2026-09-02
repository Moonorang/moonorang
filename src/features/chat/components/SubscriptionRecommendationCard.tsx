'use client';

import { useRouter } from 'next/navigation';

import Button from '@/shared/ui/Button';

import { SubscriptionListItem } from '@/entities/subscription';
import CatalogCard from '@/shared/ui/CatalogCard';
import type { SubscriptionRecommendation } from '@/features/chat/types';

interface SubscriptionRecommendationCardProps {
  recommendations: SubscriptionRecommendation[];
}

/**
 * CARD-027~028: 관심사에 맞춘(없으면 인기순) 구독 상품 추천 카드.
 * AddOnRecommendationCard와 같은 패턴 - 목록 페이지(features/catalog)의
 * SubscriptionRow와 같은 entities/subscription의 SubscriptionListItem +
 * shared/ui/CatalogCard를 그대로 재사용한다. "둘러보기"는 구독 상품 탭이
 * 활성화된 상품 목록으로 이동한다.
 */
export default function SubscriptionRecommendationCard({
  recommendations,
}: SubscriptionRecommendationCardProps) {
  const router = useRouter();

  if (recommendations.length === 0) return null;

  return (
    <div className="flex w-[80%] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-14 font-bold text-text-primary">구독 상품 추천</h3>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {recommendations.map((item) => (
          <CatalogCard
            key={item.subscription.id}
            appendClassName="shadow-none border border-border-default"
          >
            <SubscriptionListItem
              subscription={item.subscription}
              adoptionRate={item.adoptionRate}
            />
          </CatalogCard>
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth
        onClick={() => router.push('/catalog?tab=subscriptions')}
      >
        둘러보기
      </Button>
    </div>
  );
}
