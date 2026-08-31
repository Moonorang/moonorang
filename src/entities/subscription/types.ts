// 구독 상품 타입 subscriptions 테이블 컬럼 반영
export interface Subscription {
  id: number;
  name: string;
  baseMonthlyFee: number;
  discount: number;
  highlight: string | null;
}
