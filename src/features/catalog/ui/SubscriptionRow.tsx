import Image from 'next/image';

import CatalogCard from '@/features/catalog/ui/CatalogCard';

import { CATALOG_IMAGE_BASE_PATH } from '@/features/catalog/constants';
import { getDiscountedFee } from '@/features/catalog/lib/getDiscountedFee';
import { formatWon } from '@/shared/utils/formatCurrency';
import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionRowProps {
  subscription: Subscription;
  /** DATA-014: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-013: 구독 상품명·월 요금·혜택
export default function SubscriptionRow({
  subscription,
  onSelect,
}: SubscriptionRowProps) {
  const { name, baseMonthlyFee, discount, description } = subscription;
  const { fee } = getDiscountedFee(baseMonthlyFee, discount);
  const hasDiscount = discount > 0;
  // description.image 는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${description?.image ?? 'netflix_youtube.jpg'}`;

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-1 cursor-pointer items-center gap-4 px-4 py-5 text-left"
      >
        {/* 이미지 높이만큼 늘려, 상품명은 위 끝 · 요금은 아래 끝에 붙인다.
            할인 배지는 그 사이에 놓여서, 있든 없든 요금 위치가 그대로다. */}
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-2">
          <p className="truncate text-12 font-medium text-text-primary">
            {name}
          </p>

          <div className="text-12 font-medium text-text-primary">
            {hasDiscount && (
              <p className="flex items-center gap-1.5 text-10">
                <span className="shrink-0 text-action-primary">
                  {discount}%
                </span>
                <span className="truncate text-10 font-normal text-text-secondary line-through">
                  월 {formatWon(baseMonthlyFee)}원
                </span>
              </p>
            )}
            <p>{formatWon(fee)}원 / 1개월</p>
          </div>
        </div>

        <Image
          src={imageSrc}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
      </button>
    </CatalogCard>
  );
}
