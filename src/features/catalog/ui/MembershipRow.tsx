import { MembershipBrandListItem } from '@/entities/membershipBrand';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface MembershipRowProps {
  brand: MembershipBrand;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-018: 태그·제휴사명·혜택. 내용물(MembershipBrandListItem)은 채팅의 "내 주변
// 혜택" 카드와 공유한다 - 여기서는 목록 페이지 전용인 "카드 전체 클릭" 임시 처리만 얹는다.
export default function MembershipRow({ brand }: MembershipRowProps) {
  // TODO: 상세 화면 연결 전까지 임시 처리
  const handleCardClick = () => {
    alert(`${brand.name} 상세`);
  };

  return (
    <CatalogCard>
      <MembershipBrandListItem brand={brand} onClick={handleCardClick} />
    </CatalogCard>
  );
}
