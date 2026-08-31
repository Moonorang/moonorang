import type { AddOn } from '@/entities/addOn/types';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';

// 상품·혜택 목록 화면 (DATA-001~020)

// 목록 화면의 탭 종류
export type CatalogTab = 'plans' | 'addOns' | 'subscriptions' | 'memberships';

// 탭 하나의 구성 - 식별자와 화면에 보일 이름
export interface CatalogTabItem {
  key: CatalogTab;
  label: string;
}

// 화면이 한 번에 받는 마스터 데이터 4종.
// 키는 CatalogTab 값과 같게 유지한다 - 활성 탭으로 바로 목록을 꺼내 쓴다.
export interface CatalogData {
  plans: Plan[];
  addOns: AddOn[];
  subscriptions: Subscription[];
  memberships: MembershipBrand[];
}
