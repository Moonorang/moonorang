'use client';

import { useState } from 'react';

import { getCatalogPanelId } from '@/features/catalog/lib/getCatalogPanelId';
import type { CatalogTab } from '@/features/catalog/types';

/**
 * 상품·혜택 목록의 탭과 아코디언 상태.
 * 화면은 activeTab 으로 무엇을 보여줄지만 정하고, 전환 규칙과 패널 id 규칙은 여기서 갖는다.
 */
export function useCatalogTabs(initialTab: CatalogTab = 'plans') {
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
  // 아코디언은 탭마다 하나씩만 펼친다. 키는 `${탭}-${id}`.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
    // 탭을 옮기면 이전 탭에서 펼쳐둔 카드는 닫는다.
    setExpandedKey(null);
  };

  const handleToggle = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return {
    activeTab,
    // 탭(aria-controls)과 짝이 되는 패널 id
    panelId: getCatalogPanelId(activeTab),
    expandedKey,
    handleTabChange,
    handleToggle,
  };
}
