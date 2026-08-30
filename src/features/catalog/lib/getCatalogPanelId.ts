import type { CatalogTab } from '@/features/catalog/types';

// 탭(aria-controls)과 패널(id)을 잇는 값. 양쪽이 같은 규칙을 써야 해서 여기 모아둔다.
export function getCatalogPanelId(tab: CatalogTab): string {
  return `catalog-panel-${tab}`;
}
