'use client';

import AddOnRow from '@/features/catalog/ui/AddOnRow';
import CatalogTabs from '@/features/catalog/ui/CatalogTabs';
import EmptyNotice from '@/features/catalog/ui/EmptyNotice';
import MembershipRow from '@/features/catalog/ui/MembershipRow';
import PlanRow from '@/features/catalog/ui/PlanRow';
import SubscriptionRow from '@/features/catalog/ui/SubscriptionRow';

import { CATALOG_EMPTY_MESSAGES } from '@/features/catalog/constants';
import { useCatalogTabs } from '@/features/catalog/hooks/useCatalogTabs';
import type { CatalogData } from '@/features/catalog/types';

interface CatalogViewProps {
  catalog: CatalogData;
}

/**
 * 상품·혜택 목록 화면.
 * 데이터는 서버(page.tsx)에서 받아 props 로 내려오고, 여기서는 탭·아코디언 상태만 갖는다.
 */
export default function CatalogView({ catalog }: CatalogViewProps) {
  // 1. 상태 및 훅
  const { activeTab, panelId, expandedKey, handleTabChange, handleToggle } =
    useCatalogTabs();

  // 2. 렌더링
  const items = catalog[activeTab];

  return (
    <main className="mx-auto flex w-full max-w-(--width-container) flex-col pt-(--height-header) pb-10">
      <CatalogTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div
        id={panelId}
        role="tabpanel"
        className="flex flex-col gap-2 px-4 py-4"
      >
        {items.length === 0 ? (
          <EmptyNotice message={CATALOG_EMPTY_MESSAGES[activeTab]} />
        ) : (
          <>
            {activeTab === 'plans' &&
              catalog.plans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  isExpanded={expandedKey === `plans-${plan.id}`}
                  onToggle={() => handleToggle(`plans-${plan.id}`)}
                />
              ))}

            {activeTab === 'addOns' &&
              catalog.addOns.map((addOn) => (
                <AddOnRow
                  key={addOn.id}
                  addOn={addOn}
                  isExpanded={expandedKey === `addOns-${addOn.id}`}
                  onToggle={() => handleToggle(`addOns-${addOn.id}`)}
                />
              ))}

            {activeTab === 'subscriptions' &&
              catalog.subscriptions.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}

            {activeTab === 'memberships' &&
              catalog.memberships.map((brand) => (
                <MembershipRow
                  key={brand.id}
                  brand={brand}
                  isExpanded={expandedKey === `memberships-${brand.id}`}
                  onToggle={() => handleToggle(`memberships-${brand.id}`)}
                />
              ))}
          </>
        )}
      </div>
    </main>
  );
}
