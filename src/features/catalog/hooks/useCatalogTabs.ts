'use client';

import { useState } from 'react';

import { getCatalogPanelId } from '@/features/catalog/lib/getCatalogPanelId';
import type { CatalogTab } from '@/features/catalog/types';

/**
 * 상품·혜택 목록의 탭 상태.
 * 화면은 activeTab 으로 무엇을 보여줄지만 정하고, 전환과 패널 id 규칙은 여기서 갖는다.
 */
export function useCatalogTabs(initialTab: CatalogTab = 'plans') {
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);

  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    // 탭(aria-controls)과 짝이 되는 패널 id
    panelId: getCatalogPanelId(activeTab),
    handleTabChange,
  };
}
