import { SubscriptionListItem } from '@/entities/subscription';
import type { Subscription } from '@/entities/subscription/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface SubscriptionRowProps {
  subscription: Subscription;
  /** DATA-014: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-013: 구독 상품명·월 요금·혜택. 내용물(SubscriptionListItem)은 채팅 추천 카드와 공유한다.
export default function SubscriptionRow({
  subscription,
  onSelect,
}: SubscriptionRowProps) {
  return (
    <CatalogCard>
      <SubscriptionListItem subscription={subscription} onClick={onSelect} />
    </CatalogCard>
  );
}
