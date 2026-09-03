// features/catalog Public API — 상품·혜택 목록 (DATA-001~020)
// 서버 전용(getCatalogData)은 @/features/catalog/server 로 따로 가져간다.
// CatalogCard는 여기 없다 - features/chat도 재사용해야 해서 shared/ui에 그대로 둔다
// (features끼리 직접 참조할 수 없어서, features/catalog 안에 있으면 그 재사용이 막힌다).
export { default as CatalogView } from './ui/CatalogView';
export { default as CatalogTabs } from './ui/CatalogTabs';
export { default as PlanDetailModal } from './ui/PlanDetailModal';
export { default as AddOnDetailModal } from './ui/AddOnDetailModal';
export { default as SubscriptionDetailModal } from './ui/SubscriptionDetailModal';
export { default as MembershipDetailModal } from './ui/MembershipDetailModal';
export { default as MembershipDetailCard } from './ui/MembershipDetailCard';
export { default as EmptyNotice } from './ui/EmptyNotice';
export { useCatalogTabs } from './hooks/useCatalogTabs';
export { useCatalogDetail } from './hooks/useCatalogDetail';
export { CATALOG_TABS, CATALOG_EMPTY_MESSAGES } from './constants';
export { getCatalogPanelId } from './lib/getCatalogPanelId';
export type { CatalogTab, CatalogTabItem, CatalogData } from './types';
