import type { CatalogTabItem } from '@/features/catalog/types';

// 탭 구성이 바뀌면 CatalogTabs 가 아니라 이 배열만 고친다.
export const CATALOG_TABS: CatalogTabItem[] = [
  { key: 'plans', label: '요금제' },
  { key: 'addOns', label: '부가서비스' },
  { key: 'subscriptions', label: '구독 상품' },
  { key: 'memberships', label: '멤버십' },
];
