import Image from 'next/image';

import type { MembershipBrand } from '@/entities/membershipBrand/types';
import { CATALOG_IMAGE_BASE_PATH } from '@/shared/utils/catalogImagePath';

interface MembershipBrandListItemProps {
  brand: MembershipBrand;
  /** 있으면 클릭 가능한 카드로, 없으면 그냥 정보 표시용 카드로 렌더한다 */
  onClick?: () => void;
  /**
   * 카카오 로컬 API로 찾은 구체적 지점명·거리 - 목록 페이지(features/catalog)는
   * 안 쓰고, "내 주변 혜택"(features/chat)만 쓰는 채팅 전용 정보다. 안 주면
   * (undefined) 지점 줄 자체가 안 뜬다.
   */
  placeName?: string;
  distanceMeters?: number;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

/**
 * DATA-018: 태그·제휴사명·혜택. 카드 하나의 내용물만 - 바깥 테두리는
 * shared/ui/CatalogCard가 맡는다(목록 페이지의 MembershipRow, 채팅의
 * NearbyMembershipCard 둘 다 이 컴포넌트를 그대로 재사용한다).
 */
export default function MembershipBrandListItem({
  brand,
  onClick,
  placeName,
  distanceMeters,
}: MembershipBrandListItemProps) {
  const { name, category, icon, discountRules } = brand;
  // membership_brands.icon 에는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${icon}`;
  const summary = discountRules?.summary;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full flex-1 items-center gap-5 px-4 py-4 text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      <Image
        src={imageSrc}
        alt=""
        width={60}
        height={60}
        className="h-[60px] w-[60px] shrink-0 rounded-full border border-border-default object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="truncate text-12 text-text-primary">{category}</p>
          <p className="truncate text-16 font-medium text-text-primary">{name}</p>
        </div>
        {/* 요약 자리를 두 줄(18px * 2)로 고정하고 그 안에서 세로 가운데 정렬.
            줄 수가 달라도 카드마다 브랜드명 위치와 카드 높이가 어긋나지 않는다. */}
        {summary && (
          <p className="flex min-h-9 items-center text-12 leading-fixed whitespace-pre-line text-text-primary">
            {summary}
          </p>
        )}
        {placeName && (
          <p className="truncate text-10 text-text-secondary">
            {placeName}
            {typeof distanceMeters === 'number' && ` · ${formatDistance(distanceMeters)}`}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
