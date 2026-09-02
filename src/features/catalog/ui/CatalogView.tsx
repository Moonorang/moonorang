'use client';

import AddOnDetailModal from '@/features/catalog/ui/AddOnDetailModal';
import AddOnRow from '@/features/catalog/ui/AddOnRow';
import CatalogTabs from '@/features/catalog/ui/CatalogTabs';
import EmptyNotice from '@/features/catalog/ui/EmptyNotice';
import MembershipRow from '@/features/catalog/ui/MembershipRow';
import PlanDetailModal from '@/features/catalog/ui/PlanDetailModal';
import PlanRow from '@/features/catalog/ui/PlanRow';
import SubscriptionDetailModal from '@/features/catalog/ui/SubscriptionDetailModal';
import SubscriptionRow from '@/features/catalog/ui/SubscriptionRow';

import { CATALOG_EMPTY_MESSAGES } from '@/features/catalog/constants';
import { useCatalogDetail } from '@/features/catalog/hooks/useCatalogDetail';
import { useCatalogTabs } from '@/features/catalog/hooks/useCatalogTabs';
import {
  buildAddOnJoinMessage,
  buildPlanJoinMessage,
  buildSubscriptionJoinMessage,
} from '@/features/catalog/lib/joinMessage';
import type { CatalogData } from '@/features/catalog/types';

interface CatalogViewProps {
  catalog: CatalogData;
}

/**
 * 상품·혜택 목록 화면.
 * 데이터는 서버(page.tsx)에서 받아 props 로 내려오고,
 * 여기서는 탭 상태와, 어떤 항목의 상세가 열려 있는지만 갖는다.
 */
export default function CatalogView({ catalog }: CatalogViewProps) {
  // 1. 상태 및 훅
  const { activeTab, panelId, handleTabChange } = useCatalogTabs();
  const planDetail = useCatalogDetail(buildPlanJoinMessage);
  const addOnDetail = useCatalogDetail(buildAddOnJoinMessage);
  const subscriptionDetail = useCatalogDetail(buildSubscriptionJoinMessage);

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
                  onSelect={() => planDetail.openDetail(plan)}
                />
              ))}

            {activeTab === 'addOns' &&
              catalog.addOns.map((addOn) => (
                <AddOnRow
                  key={addOn.id}
                  addOn={addOn}
                  onSelect={() => addOnDetail.openDetail(addOn)}
                />
              ))}

            {activeTab === 'subscriptions' &&
              catalog.subscriptions.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                  onSelect={() => subscriptionDetail.openDetail(subscription)}
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
        plan={planDetail.selectedItem}
        onClose={planDetail.closeDetail}
        onJoin={planDetail.goToJoin}
      />

      <AddOnDetailModal
        addOn={addOnDetail.selectedItem}
        onClose={addOnDetail.closeDetail}
        onJoin={addOnDetail.goToJoin}
      />

      <SubscriptionDetailModal
        subscription={subscriptionDetail.selectedItem}
        onClose={subscriptionDetail.closeDetail}
        onJoin={subscriptionDetail.goToJoin}
      />
    </main>
  );
}
