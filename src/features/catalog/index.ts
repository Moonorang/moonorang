// features/catalog Public API — 상품·혜택 목록 (DATA-001~020)
export { default as CatalogTabs } from './ui/CatalogTabs';
export { useCatalogTabs } from './hooks/useCatalogTabs';
export { CATALOG_TABS } from './constants';
export { getCatalogPanelId } from './lib/getCatalogPanelId';
export type { CatalogTab, CatalogTabItem } from './types';
