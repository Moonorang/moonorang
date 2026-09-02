import Image from 'next/image';

import Button from '@/shared/ui/Button';

import { CATALOG_IMAGE_BASE_PATH } from '@/features/catalog/constants';
import { getDiscountedFee } from '@/features/catalog/lib/getDiscountedFee';
import { formatWon } from '@/shared/utils/formatCurrency';
import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionDetailCardProps {
  subscription: Subscription;
  /**
   * 가입으로 넘어가는 버튼의 동작.
   * 넘기지 않으면 버튼 자체를 그리지 않는다 - PlanDetailCard 와 같은 규칙.
   */
  onJoin?: () => void;
}

/**
 * 구독 상품 하나를 펼쳐 보여주는 상세 내용.
 * 폭·배경·바깥 여백은 감싸는 쪽이 정하고 여기서는 안쪽 간격만 갖는다.
 */
export default function SubscriptionDetailCard({
  subscription,
  onJoin,
}: SubscriptionDetailCardProps) {
  const { name, baseMonthlyFee, discount, highlight, description } =
    subscription;
  const { fee } = getDiscountedFee(baseMonthlyFee, discount);
  const hasDiscount = discount > 0;
  // description.image 는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${description?.image ?? 'netflix_youtube.jpg'}`;
  const features = description?.features ?? [];

  return (
    // 본문 ↔ 버튼만 넓게 띄우고, 본문 안쪽은 한 값으로 통일한다
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {/* 이미지 높이만큼 늘려, 상품명은 위 끝 · 요금은 아래 끝에 붙인다.
            간격을 고정값으로 주지 않아서 이미지 크기가 바뀌어도 양 끝에 맞춰 따라간다 -
            SubscriptionRow 와 같은 방식이라 목록에서 상세로 들어와도 배치가 안 흔들린다. */}
        <div className="flex items-center">
          <div className="my-2 flex min-w-0 flex-1 flex-col justify-between self-stretch">
            <h3 className="truncate text-14 font-medium text-text-primary">
              {name}
            </h3>

            {/* 할인 배지는 그 사이에 놓여서, 있든 없든 요금 위치가 그대로다 */}
            <div className="text-12 font-medium text-text-primary">
              {hasDiscount && (
                <p className="flex items-center gap-1 text-10">
                  <span className="shrink-0 text-action-primary">
                    {discount}%
                  </span>
                  <span className="truncate font-normal text-text-secondary line-through">
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
        </div>

        <hr className="border-border-default" />

        <section className="flex flex-col gap-2">
          <h4 className="text-12 font-medium text-text-primary">구독 혜택</h4>

          {highlight && (
            <p className="text-10 leading-fixed text-action-primary">
              {highlight}
            </p>
          )}

          {features.length > 0 && (
            <ul className="flex list-disc flex-col gap-1.5 pl-4">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="text-10 leading-fixed text-text-secondary"
                >
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {onJoin && (
        <Button
          variant="main"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onJoin}
        >
          채팅에서 가입하기
        </Button>
      )}
    </div>
  );
}
