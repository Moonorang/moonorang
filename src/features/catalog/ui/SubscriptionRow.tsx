import Image from 'next/image';

import CatalogCard from '@/features/catalog/ui/CatalogCard';

import { CATALOG_IMAGE_BASE_PATH } from '@/features/catalog/constants';
import { getDiscountedFee } from '@/features/catalog/lib/getDiscountedFee';
import { formatWon } from '@/shared/utils/formatCurrency';
import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionRowProps {
  subscription: Subscription;
}

// DATA-013: 구독 상품명·월 요금·혜택
export default function SubscriptionRow({
  subscription,
}: SubscriptionRowProps) {
  const { name, baseMonthlyFee, discount, description } = subscription;
  const { fee } = getDiscountedFee(baseMonthlyFee, discount);
  const hasDiscount = discount > 0;
  // description.image 는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${description?.image ?? 'netflix_youtube.jpg'}`;

  // TODO: 상세 화면 연결 전까지 임시 처리
  const handleCardClick = () => {
    alert(`${name} 상세`);
  };

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={handleCardClick}
        className="flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2.75">
          <p className="truncate text-12 font-medium text-text-primary">
            {name}
          </p>

          <p className="text-12 font-medium text-text-primary">
            {hasDiscount && (
              <div className="flex items-center gap-1.5 text-10">
                <span className="shrink-0 text-action-primary">
                  {discount}%
                </span>
                <span className="truncate text-10 font-normal text-text-secondary line-through">
                  월 {formatWon(baseMonthlyFee)}원
                </span>
              </div>
            )}
            <div className={`${hasDiscount ? `` : `mt-3.75`}`}>
              {formatWon(fee)}원 / 1개월
            </div>
          </p>
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
