'use client';

import { useRouter } from 'next/navigation';

import Button from '@/shared/ui/Button';

import { AddOnListItem } from '@/entities/addOn';
import CatalogCard from '@/shared/ui/CatalogCard';
import type { AddOnRecommendation } from '@/features/chat/types';

interface AddOnRecommendationCardProps {
  recommendations: AddOnRecommendation[];
}

/**
 * CARD-027~028: 관심사에 맞춘(없으면 인기순) 부가서비스 추천 카드.
 * addOnRecommendation 이벤트 하나를 그대로 받아 그린다 - 항목이 많아도 카드 높이는
 * 고정하고 내부 스크롤로 본다. "둘러보기"는 부가서비스 탭이 활성화된 상품 목록으로 이동한다.
 *
 * 목록 페이지(features/catalog)의 AddOnRow와 같은 entities/addOn의 AddOnListItem +
 * shared/ui/CatalogCard를 그대로 재사용한다 - 새로 만들지 않는다. 차이는 두 가지뿐:
 * onClick을 안 준다(상세 풀모달은 다른 팀원이 만들고 있어 지금은 눌러도 아무 일도
 * 안 일어나야 한다), adoptionRate 배지를 준다(목록 페이지엔 없는 채팅 전용 정보).
 */
export default function AddOnRecommendationCard({
  recommendations,
}: AddOnRecommendationCardProps) {
  const router = useRouter();

  if (recommendations.length === 0) return null;

  return (
    <div className="flex w-[80%] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-14 font-bold text-text-primary">부가서비스 추천</h3>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {recommendations.map((item) => (
          <CatalogCard
            key={item.addOn.id}
            appendClassName="shadow-none border border-border-default"
          >
            <AddOnListItem addOn={item.addOn} adoptionRate={item.adoptionRate} />
          </CatalogCard>
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth
        onClick={() => router.push('/catalog?tab=addOns')}
      >
        둘러보기
      </Button>
    </div>
  );
}
