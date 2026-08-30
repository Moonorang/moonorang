'use client';

import CatalogTabs from '@/features/catalog/ui/CatalogTabs';

import { useCatalogTabs } from '@/features/catalog/hooks/useCatalogTabs';

export default function CatalogPage() {
  // 1. 상태 및 훅
  const { activeTab, panelId, handleTabChange } = useCatalogTabs();

  // 2. 렌더링
  return (
    <main className="mx-auto flex w-full max-w-(--width-container) flex-col pt-(--height-header) pb-10">
      <CatalogTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div id={panelId} className="flex flex-col gap-3 px-4 py-4">
        {activeTab}
      </div>
    </main>
  );
}
