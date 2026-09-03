'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/shared/ui/Button';

import { SubscriptionListItem } from '@/entities/subscription';
import type { Subscription } from '@/entities/subscription/types';
import SubscriptionDetailModal from '@/entities/subscription/ui/SubscriptionDetailModal';
import CatalogCard from '@/shared/ui/CatalogCard';
import type { SubscriptionRecommendation } from '@/features/chat/types';

interface SubscriptionRecommendationCardProps {
  recommendations: SubscriptionRecommendation[];
  /** DATA-015: 상세에서 신청하기를 누르면 대화에 가입 카드를 띄운다 */
  onJoin?: (subscription: Subscription) => void;
}

/**
 * CARD-027~028: 관심사에 맞춘(없으면 인기순) 구독 상품 추천 카드.
 * AddOnRecommendationCard와 같은 패턴 - 목록 페이지(features/catalog)의
 * SubscriptionRow와 같은 entities/subscription의 SubscriptionListItem +
 * shared/ui/CatalogCard를 그대로 재사용한다. "둘러보기"는 구독 상품 탭이
 * 활성화된 상품 목록으로 이동한다.
 *
 * 항목을 누르면 목록과 같은 상세 모달이 뜨고, 거기서 신청하기를 누르면 목록과
 * 달리 채팅으로 넘어가지 않고 그 자리에 가입 카드를 띄운다 - 이미 채팅 안이다.
 */
export default function SubscriptionRecommendationCard({
  recommendations,
  onJoin,
}: SubscriptionRecommendationCardProps) {
  // 1. 상태 및 훅
  const router = useRouter();
  // 열려 있는 상세. null 이면 닫힌 상태
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  // 2. 이벤트 핸들러
  const handleJoinClick = (subscription: Subscription) => {
    // 가입 카드는 대화 맨 끝에 붙으므로, 화면을 덮고 있는 상세를 먼저 걷어낸다
    setSelectedSubscription(null);
    onJoin?.(subscription);
  };

  // 3. 렌더링
  if (recommendations.length === 0) return null;

  return (
    <div className="flex w-[min(80%,440px)] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-16 font-semibold text-text-primary">
        구독 상품 추천
      </h3>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {recommendations.map((item) => (
          <CatalogCard
            key={item.subscription.id}
            appendClassName="shadow-none border border-border-default"
          >
            <SubscriptionListItem
              subscription={item.subscription}
              adoptionRate={item.adoptionRate}
              onClick={() => setSelectedSubscription(item.subscription)}
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

      {/* DATA-014: 항목을 누르면 목록에서와 같은 상세가 화면을 덮으며 들어온다 */}
      <SubscriptionDetailModal
        subscription={selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
        onJoin={handleJoinClick}
      />
    </div>
  );
}
