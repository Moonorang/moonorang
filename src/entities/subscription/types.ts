// subscriptions.description 은 jsonb 로, 목록 카드에 쓰는 이미지 파일명이 들어 있다.
export interface SubscriptionDescription {
  image?: string;
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
