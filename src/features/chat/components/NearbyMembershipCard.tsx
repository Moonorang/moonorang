'use client';

import { useRouter } from 'next/navigation';

import { MapPin } from 'lucide-react';

import Button from '@/shared/ui/Button';

import type { NearbyMembership } from '@/features/chat/types';

interface NearbyMembershipCardProps {
  memberships: NearbyMembership[];
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)}m`
    : `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 항목 하나. AddOnRecommendationItem과 같은 이유로 클릭 핸들러를 아예 안 단다 -
 * 상세는 다른 팀원이 만들고 있어서, 지금은 눌러도 아무 일도 안 일어나야 한다.
 */
function NearbyMembershipItem({ item }: { item: NearbyMembership }) {
  const { brand, placeName, distanceMeters } = item;
  const discountSummary = brand.discountRules?.summary;

  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-border-default">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 bg-action-primary p-2 text-background-default">
        <MapPin size={18} aria-hidden />
        <span className="text-12 font-medium">
          {formatDistance(distanceMeters)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        <p className="font-regular truncate text-10 text-text-secondary">
          {placeName}
        </p>
        {discountSummary && (
          <p className="truncate text-14 font-medium text-text-primary">
            {discountSummary}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * CARD-028: 현재 위치 기준으로 가까운 멤버십 제휴처 카드.
 * nearbyMembership 이벤트 하나를 그대로 받아 그린다 - 브랜드마다 가장 가까운 지점
 * 1개씩, 가까운 순으로 이미 정렬돼서 온다(findNearbyMemberships.ts). "내 주변 혜택
 * 알아보기"는 멤버십 탭이 활성화된 상품 목록으로 이동한다.
 */
export default function NearbyMembershipCard({
  memberships,
}: NearbyMembershipCardProps) {
  const router = useRouter();

  if (memberships.length === 0) return null;

  return (
    <div className="flex w-[80%] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-14 font-bold text-text-primary">내 주변 혜택</h3>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {memberships.map((item) => (
          <NearbyMembershipItem key={item.brand.id} item={item} />
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth
        onClick={() => router.push('/catalog?tab=memberships')}
      >
        내 주변 혜택 알아보기
      </Button>
    </div>
  );
}
