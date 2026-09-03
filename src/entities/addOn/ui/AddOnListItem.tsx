import { ThumbsUp } from 'lucide-react';

import { ADD_ON_ICON_FALLBACK, ADD_ON_ICONS } from '@/entities/addOn/lib/icons';
import type { AddOn } from '@/entities/addOn/types';
import { formatMonthlyFee } from '@/shared/utils/formatMonthlyFee';

interface AddOnListItemProps {
  addOn: AddOn;
  /** 있으면 클릭 가능한 카드로, 없으면 그냥 정보 표시용 카드로 렌더한다 */
  onClick?: () => void;
  /**
   * "N%의 고객님이 선택했어요" 배지 (entities/addOn/server의 getAddOnAdoptionRates
   * 실 데이터). 목록 페이지(features/catalog)는 아직 이 배지를 안 쓰고, 채팅 추천
   * 카드(features/chat)만 쓴다 - 안 주면(undefined/0) 배지 자체가 안 뜬다.
   */
  adoptionRate?: number;
}

/**
 * DATA-008: 부가서비스명·월 요금·혜택. 카드 하나의 내용물만 - 바깥 테두리는
 * shared/ui/CatalogCard가 맡는다(목록 페이지의 AddOnRow, 채팅의
 * AddOnRecommendationCard 둘 다 이 컴포넌트를 그대로 재사용한다).
 */
export default function AddOnListItem({
  addOn,
  onClick,
  adoptionRate,
}: AddOnListItemProps) {
  const { description } = addOn;
  const Icon = ADD_ON_ICONS[description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full flex-1 flex-col justify-between gap-2 p-4 text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex w-full items-center gap-2">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-border-default">
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

      <p className="text-12 text-text-primary">
        {description?.guide ?? addOn.subTitle}
      </p>

      <p className="text-12 font-medium text-action-primary">
        {formatMonthlyFee(addOn.baseMonthlyRate)}
      </p>

      {/* 채택률이 0/미제공이면 근거 없는 소셜프루프를 만들지 않도록 숨긴다 */}
      {!!adoptionRate && adoptionRate > 0 && (
        <div className="mt-1 flex items-center gap-1 text-action-primary">
          <ThumbsUp size={12} aria-hidden />
          <span className="text-10 font-medium">
            {adoptionRate}% 의 고객님이 선택했어요!
          </span>
        </div>
      )}
    </Wrapper>
  );
}
