import { AddOnListItem } from '@/entities/addOn';
import type { AddOn } from '@/entities/addOn/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface AddOnRowProps {
  addOn: AddOn;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-008: 부가서비스명·월 요금·혜택. 내용물(AddOnListItem)은 채팅 추천 카드와
// 공유한다 - 여기서는 목록 페이지 전용인 "카드 전체 클릭" 임시 처리만 얹는다.
export default function AddOnRow({ addOn }: AddOnRowProps) {
  // TODO: 상세 화면 연결 전까지 임시 처리
  const handleCardClick = () => {
    alert(`${addOn.title} 상세`);
  };

  return (
    <CatalogCard>
      <AddOnListItem addOn={addOn} onClick={handleCardClick} />
    </CatalogCard>
  );
}
