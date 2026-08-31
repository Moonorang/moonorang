import { CATALOG_TABS } from '@/features/catalog/constants';
import { getCatalogPanelId } from '@/features/catalog/lib/getCatalogPanelId';
import type { CatalogTab } from '@/features/catalog/types';
import { cn } from '@/shared/utils/cn';

interface CatalogTabsProps {
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
}

/**
 * 상품·혜택 목록의 카테고리 탭. 선택 상태는 상위(화면)가 갖는다.
 * 헤더 바로 아래에 붙어 스크롤을 따라오는 위치까지 이 컴포넌트가 책임진다.
 */
export default function CatalogTabs({
  activeTab,
  onTabChange,
}: CatalogTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="상품 카테고리"
      className="sticky top-(--height-header) z-10 flex gap-5 border-b border-border-light bg-background-default px-4"
    >
      {CATALOG_TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={getCatalogPanelId(tab.key)}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'cursor-pointer border-b py-2 text-14 transition-colors',
              isActive
                ? 'border-action-primary text-action-primary'
                : 'border-transparent text-text-secondary hover:text-action-primary',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
