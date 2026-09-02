import { MembershipBrandListItem } from '@/entities/membershipBrand';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface MembershipRowProps {
  brand: MembershipBrand;
  /** DATA-019: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-018: 태그·제휴사명·혜택. 내용물(MembershipBrandListItem)은 채팅의 "내 주변
// 혜택" 카드와 공유한다.
export default function MembershipRow({ brand, onSelect }: MembershipRowProps) {
  return (
    <CatalogCard>
      <MembershipBrandListItem brand={brand} onClick={onSelect} />
    </CatalogCard>
  );
}
