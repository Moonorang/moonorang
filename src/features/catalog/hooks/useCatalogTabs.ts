'use client';

import { useState } from 'react';

import { getCatalogPanelId } from '@/features/catalog/lib/getCatalogPanelId';
import type { CatalogTab } from '@/features/catalog/types';

/**
 * 상품·혜택 목록의 탭 상태.
 * 화면은 activeTab 으로 무엇을 보여줄지만 정하고, 전환 규칙과 패널 id 규칙은 여기서 갖는다.
 */
export function useCatalogTabs(initialTab: CatalogTab = 'plans') {
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);

  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);

    // 목록이 통째로 바뀌므로 이전 탭에서 내려둔 스크롤 위치를 유지할 이유가 없다.
    // 그대로 두면 새 탭의 중간부터 보이거나, 항목이 더 적으면 빈 화면이 나온다.
    // 탭 바는 sticky 라 화면에 남아 있고, 스크롤되는 건 창 자체다.
    // 내용이 같은 순간에 바뀌어서 smooth 로 훑고 내려가면 오히려 어수선하다 - 즉시 이동.
    window.scrollTo({ top: 0 });
  };

  return {
    activeTab,
    // 탭(aria-controls)과 짝이 되는 패널 id
    panelId: getCatalogPanelId(activeTab),
    handleTabChange,
  };
}
