'use client';

import CatalogTabs from '@/features/catalog/ui/CatalogTabs';

import { useCatalogTabs } from '@/features/catalog/hooks/useCatalogTabs';
import type { CatalogData } from '@/features/catalog/types';

interface CatalogViewProps {
  catalog: CatalogData;
}

/**
 * 상품·혜택 목록 화면.
 * 데이터는 서버(page.tsx)에서 받아 props 로 내려오고, 여기서는 탭 전환 상태만 갖는다.
 */
export default function CatalogView({ catalog }: CatalogViewProps) {
  // 1. 상태 및 훅
  const { activeTab, panelId, handleTabChange } = useCatalogTabs();

  // 2. 렌더링
  const items = catalog[activeTab];

  return (
    <main className="mx-auto flex w-full max-w-(--width-container) flex-col pt-(--height-header) pb-10">
      <CatalogTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div
        id={panelId}
        role="tabpanel"
        className="flex flex-col gap-3 px-4 py-4"
      >
        {/* 목록 카드는 다음 단계에서 붙인다. 지금은 데이터가 여기까지 닿는지만 확인한다. */}
        <p className="text-12 text-text-secondary">{items.length}건</p>
      </div>
    </main>
  );
}
