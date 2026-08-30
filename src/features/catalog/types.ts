// 상품·혜택 목록 화면 (DATA-001~020)

// 목록 화면의 탭 종류
export type CatalogTab = 'plans' | 'addOns' | 'subscriptions' | 'memberships';

// 탭 하나의 구성 - 식별자와 화면에 보일 이름
export interface CatalogTabItem {
  key: CatalogTab;
  label: string;
}
