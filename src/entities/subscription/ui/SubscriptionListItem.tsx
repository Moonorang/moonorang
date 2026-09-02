import Image from 'next/image';

import { ThumbsUp } from 'lucide-react';

import { getDiscountedFee } from '@/entities/subscription/lib/getDiscountedFee';
import type { Subscription } from '@/entities/subscription/types';
import { CATALOG_IMAGE_BASE_PATH } from '@/shared/utils/catalogImagePath';
import { formatWon } from '@/shared/utils/formatCurrency';

interface SubscriptionListItemProps {
  subscription: Subscription;
  /** 있으면 클릭 가능한 카드로, 없으면 그냥 정보 표시용 카드로 렌더한다 */
  onClick?: () => void;
  /** AddOnListItem과 같은 원칙 - entities/subscription/server의 getSubscriptionAdoptionRates 실 데이터 */
  adoptionRate?: number;
}

/**
 * DATA-013: 구독 상품명·월 요금·혜택. 카드 하나의 내용물만 - 바깥 테두리는
 * shared/ui/CatalogCard가 맡는다(목록 페이지의 SubscriptionRow, 채팅의
 * SubscriptionRecommendationCard 둘 다 이 컴포넌트를 그대로 재사용한다).
 */
export default function SubscriptionListItem({
  subscription,
  onClick,
  adoptionRate,
}: SubscriptionListItemProps) {
  const { name, baseMonthlyFee, discount, description } = subscription;
  const { fee } = getDiscountedFee(baseMonthlyFee, discount);
  const hasDiscount = discount > 0;
  // description.image 는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${description?.image ?? 'netflix_youtube.jpg'}`;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full flex-1 items-center gap-4 px-4 py-5 text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* 이미지 높이만큼 늘려, 상품명은 위 끝 · 요금은 아래 끝에 붙인다.
          할인 배지는 그 사이에 놓여서, 있든 없든 요금 위치가 그대로다. */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 self-stretch py-2">
        <p className="truncate text-12 font-medium text-text-primary">{name}</p>

        <div className="text-12 font-medium text-text-primary">
          {hasDiscount && (
            <p className="flex items-center gap-1.5 text-10">
              <span className="shrink-0 text-action-primary">{discount}%</span>
              <span className="truncate text-10 font-normal text-text-secondary line-through">
                월 {formatWon(baseMonthlyFee)}원
              </span>
            </p>
          )}
          <p>{formatWon(fee)}원 / 1개월</p>
        </div>

        {/* 채택률이 0/미제공이면 근거 없는 소셜프루프를 만들지 않도록 숨긴다 */}
        {!!adoptionRate && adoptionRate > 0 && (
          <div className="flex items-center gap-1 text-action-primary">
            <ThumbsUp size={12} aria-hidden />
            <span className="text-10 font-medium">
              {adoptionRate}% 의 고객님이 선택했어요!
            </span>
          </div>
        )}
      </div>

      <Image
        src={imageSrc}
        alt=""
        width={80}
        height={80}
        className="h-20 w-20 shrink-0 rounded-md object-cover"
      />
    </Wrapper>
  );
}
