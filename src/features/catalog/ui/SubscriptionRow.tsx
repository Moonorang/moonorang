import { SubscriptionListItem } from '@/entities/subscription';
import type { Subscription } from '@/entities/subscription/types';
import CatalogCard from '@/shared/ui/CatalogCard';

interface SubscriptionRowProps {
  subscription: Subscription;
}

// DATA-013: 구독 상품명·월 요금·혜택. 내용물(SubscriptionListItem)은 채팅 추천
// 카드와 공유한다 - 여기서는 목록 페이지 전용인 "카드 전체 클릭" 임시 처리만 얹는다.
export default function SubscriptionRow({ subscription }: SubscriptionRowProps) {
  // TODO: 상세 화면 연결 전까지 임시 처리
  const handleCardClick = () => {
    alert(`${subscription.name} 상세`);
  };

  return (
    <CatalogCard>
      <SubscriptionListItem subscription={subscription} onClick={handleCardClick} />
    </CatalogCard>
  );
}
