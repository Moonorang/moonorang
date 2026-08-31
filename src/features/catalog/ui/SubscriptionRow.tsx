import CatalogCard from '@/features/catalog/ui/CatalogCard';
import Tag from '@/shared/ui/Tag';

import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
import { getDiscountedFee } from '@/features/catalog/lib/getDiscountedFee';
import { formatWon } from '@/shared/utils/formatCurrency';
import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionRowProps {
  subscription: Subscription;
}

// DATA-013: 구독 상품명·월 요금·혜택. 펼칠 상세가 없어 한 줄로 끝난다.
export default function SubscriptionRow({
  subscription,
}: SubscriptionRowProps) {
  const { fee, label } = getDiscountedFee(
    subscription.baseMonthlyFee,
    subscription.discount,
  );

  return (
    <CatalogCard>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-14 font-semibold text-text-main">
            {subscription.name}
          </p>
          {subscription.highlight && (
            <p className="text-12 text-text-secondary">
              {subscription.highlight}
            </p>
          )}
          {label && <Tag className="mt-1.5">{label}</Tag>}
        </div>

        <div className="shrink-0 text-right">
          {label && (
            <p className="text-10 text-text-secondary line-through">
              월 {formatWon(subscription.baseMonthlyFee)}
            </p>
          )}
          <p className="text-14 font-semibold text-primary-red">
            {formatMonthlyFee(fee)}
          </p>
        </div>
      </div>
    </CatalogCard>
  );
}
