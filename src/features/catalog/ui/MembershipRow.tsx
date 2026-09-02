import Image from 'next/image';

import CatalogCard from '@/features/catalog/ui/CatalogCard';

import { CATALOG_IMAGE_BASE_PATH } from '@/features/catalog/constants';
import type { MembershipBrand } from '@/entities/membershipBrand/types';

interface MembershipRowProps {
  brand: MembershipBrand;
  /** DATA-019: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-018: 태그·제휴사명·혜택
export default function MembershipRow({ brand, onSelect }: MembershipRowProps) {
  const { name, category, icon, discountRules } = brand;
  // membership_brands.icon 에는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${icon}`;
  const summary = discountRules?.summary;

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-1 cursor-pointer items-center gap-5 px-4 py-4 text-left"
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
            <p className="truncate text-16 font-medium text-text-primary">
              {name}
            </p>
          </div>
          {/* 요약 자리를 두 줄(18px * 2)로 고정하고 그 안에서 세로 가운데 정렬.
              줄 수가 달라도 카드마다 브랜드명 위치와 카드 높이가 어긋나지 않는다. */}
          {summary && (
            <p className="flex min-h-9 items-center text-12 leading-fixed whitespace-pre-line text-text-primary">
              {summary}
            </p>
          )}
        </div>
      </button>
    </CatalogCard>
  );
}
