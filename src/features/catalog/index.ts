// features/catalog Public API — 상품·혜택 목록 (DATA-001~020)
// 서버 전용(getCatalogData)은 @/features/catalog/server 로 따로 가져간다.
export { default as CatalogView } from './ui/CatalogView';
export { default as CatalogTabs } from './ui/CatalogTabs';
export { default as EmptyNotice } from './ui/EmptyNotice';
export { useCatalogTabs } from './hooks/useCatalogTabs';
export { CATALOG_TABS, CATALOG_EMPTY_MESSAGES } from './constants';
export { getCatalogPanelId } from './lib/getCatalogPanelId';
export type { CatalogTab, CatalogTabItem, CatalogData } from './types';
