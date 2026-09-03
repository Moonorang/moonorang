// subscriptions.description 은 jsonb 로, 목록 카드에 쓰는 아이콘 키가 들어 있다.
export interface SubscriptionDescription {
  // 목록에서 보여줄 아이콘 키 (예: icon_video)
  icon?: string;
  subTitle?: string;
  features?: string[];
}

// 구독 상품 타입 subscriptions 테이블 컬럼 반영
export interface Subscription {
  id: number;
  name: string;
  baseMonthlyFee: number;
  discount: number;
  highlight: string | null;
  description: SubscriptionDescription | null;
}
