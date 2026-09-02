import { AddOnListItem } from '@/entities/addOn';
import type { AddOn } from '@/entities/addOn/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface AddOnRowProps {
  addOn: AddOn;
  /** DATA-009: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-008: 부가서비스명·월 요금·혜택. 내용물(AddOnListItem)은 채팅 추천 카드와 공유한다.
export default function AddOnRow({ addOn, onSelect }: AddOnRowProps) {
  return (
    <CatalogCard>
      <AddOnListItem addOn={addOn} onClick={onSelect} />
    </CatalogCard>
  );
}
