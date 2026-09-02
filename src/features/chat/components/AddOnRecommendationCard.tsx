'use client';

import { useRouter } from 'next/navigation';

import { ThumbsUp } from 'lucide-react';

import Button from '@/shared/ui/Button';

import { ADD_ON_ICON_FALLBACK, ADD_ON_ICONS } from '@/entities/addOn';
import { formatMonthlyFee } from '@/shared/utils/formatMonthlyFee';
import type { AddOnRecommendation } from '@/features/chat/types';

interface AddOnRecommendationCardProps {
  recommendations: AddOnRecommendation[];
}

/**
 * 목록 하나. 클릭하면 상세 풀모달로 가야 하지만 그건 다른 팀원이 만들고 있어서
 * 지금은 onClick을 아예 달지 않는다 - 눌러도 아무 일도 안 일어나는 게 의도된 동작이다.
 */
function AddOnRecommendationItem({ item }: { item: AddOnRecommendation }) {
  const { addOn, adoptionRate } = item;
  const Icon =
    ADD_ON_ICONS[addOn.description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-default">
          <Icon
            size={16}
            strokeWidth={1.5}
            className="text-text-primary"
            aria-hidden
          />
        </span>
        <p className="min-w-0 truncate text-14 font-medium text-text-primary">
          {addOn.title}
        </p>
      </div>

      <p className="text-12 leading-relaxed text-text-secondary">
        {addOn.description?.guide ?? addOn.subTitle}
      </p>

      <p className="text-12 font-medium text-text-primary">
        {formatMonthlyFee(addOn.baseMonthlyRate)}
      </p>

      {/* 채택률(user_add_ons 실 데이터)이 0이면 근거 없는 소셜프루프를 만들지 않도록 숨긴다 */}
      {adoptionRate > 0 && (
        <div className="flex items-center gap-1 text-action-primary">
          <ThumbsUp size={12} aria-hidden />
          <span className="text-10 font-medium">
            {adoptionRate}% 의 고객님이 선택했어요!
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * CARD-027~028: 관심사에 맞춘(없으면 인기순) 부가서비스 추천 카드.
 * addOnRecommendation 이벤트 하나를 그대로 받아 그린다 - 항목이 많아도 카드 높이는
 * 고정하고 내부 스크롤로 본다. "둘러보기"는 부가서비스 탭이 활성화된 상품 목록으로 이동한다.
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
          <AddOnRecommendationItem key={item.addOn.id} item={item} />
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth={true}
        onClick={() => router.push('/catalog?tab=addOns')}
      >
        둘러보기
      </Button>
    </div>
  );
}
