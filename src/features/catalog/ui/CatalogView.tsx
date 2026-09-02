'use client';

import AddOnDetailModal from '@/features/catalog/ui/AddOnDetailModal';
import AddOnRow from '@/features/catalog/ui/AddOnRow';
import CatalogTabs from '@/features/catalog/ui/CatalogTabs';
import EmptyNotice from '@/features/catalog/ui/EmptyNotice';
import MembershipRow from '@/features/catalog/ui/MembershipRow';
import PlanDetailModal from '@/features/catalog/ui/PlanDetailModal';
import PlanRow from '@/features/catalog/ui/PlanRow';
import SubscriptionRow from '@/features/catalog/ui/SubscriptionRow';

import { CATALOG_EMPTY_MESSAGES } from '@/features/catalog/constants';
import { useAddOnDetail } from '@/features/catalog/hooks/useAddOnDetail';
import { useCatalogTabs } from '@/features/catalog/hooks/useCatalogTabs';
import { usePlanDetail } from '@/features/catalog/hooks/usePlanDetail';
import type { CatalogData } from '@/features/catalog/types';

interface CatalogViewProps {
  catalog: CatalogData;
}

/**
 * 상품·혜택 목록 화면.
 * 데이터는 서버(page.tsx)에서 받아 props 로 내려오고,
 * 여기서는 탭·아코디언 상태와 어떤 요금제 상세가 열려 있는지만 갖는다.
 */
export default function CatalogView({ catalog }: CatalogViewProps) {
  // 1. 상태 및 훅
  const { activeTab, panelId, handleTabChange } = useCatalogTabs();
  const { selectedPlan, openPlanDetail, closePlanDetail, goToJoin } =
    usePlanDetail();
  const addOnDetail = useAddOnDetail();

  // 2. 렌더링
  const items = catalog[activeTab];

  return (
    <main className="flex w-full flex-col pt-(--height-header)">
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
                  onSelect={() => openPlanDetail(plan)}
                />
              ))}

            {activeTab === 'addOns' &&
              catalog.addOns.map((addOn) => (
                <AddOnRow
                  key={addOn.id}
                  addOn={addOn}
                  onSelect={() => addOnDetail.openAddOnDetail(addOn)}
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
                <MembershipRow key={brand.id} brand={brand} />
              ))}
          </>
        )}
      </div>

      <PlanDetailModal
        plan={selectedPlan}
        onClose={closePlanDetail}
        onJoin={goToJoin}
      />

      <AddOnDetailModal
        addOn={addOnDetail.selectedAddOn}
        onClose={addOnDetail.closeAddOnDetail}
        onJoin={addOnDetail.goToJoin}
      />
    </main>
  );
}
