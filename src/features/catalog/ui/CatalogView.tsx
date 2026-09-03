'use client';

import AddOnDetailModal from '@/features/catalog/ui/AddOnDetailModal';
import AddOnRow from '@/features/catalog/ui/AddOnRow';
import CatalogTabs from '@/features/catalog/ui/CatalogTabs';
import EmptyNotice from '@/features/catalog/ui/EmptyNotice';
import MembershipDetailModal from '@/features/catalog/ui/MembershipDetailModal';
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
import type { CatalogData, CatalogTab } from '@/features/catalog/types';

import type { MembershipBrand } from '@/entities/membershipBrand/types';

interface CatalogViewProps {
  catalog: CatalogData;
  /** 채팅 카드의 "둘러보기"처럼, 특정 탭을 미리 선택한 채로 들어올 때 쓴다 */
  initialTab?: CatalogTab;
}

/**
 * 상품·혜택 목록 화면.
 * 데이터는 서버(page.tsx)에서 받아 props 로 내려오고,
 * 여기서는 탭 상태와, 어떤 항목의 상세가 열려 있는지만 갖는다.
 */
export default function CatalogView({ catalog, initialTab }: CatalogViewProps) {
  // 1. 상태 및 훅
  const { activeTab, panelId, handleTabChange } = useCatalogTabs(initialTab);
  const planDetail = useCatalogDetail(buildPlanJoinMessage);
  const addOnDetail = useCatalogDetail(buildAddOnJoinMessage);
  const subscriptionDetail = useCatalogDetail(buildSubscriptionJoinMessage);
  // 멤버십은 가입 대상이 아니라 열고 닫는 것만 쓴다
  const membershipDetail = useCatalogDetail<MembershipBrand>();

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
                <MembershipRow
                  key={brand.id}
                  brand={brand}
                  onSelect={() => membershipDetail.openDetail(brand)}
                />
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

      <MembershipDetailModal
        brand={membershipDetail.selectedItem}
        onClose={membershipDetail.closeDetail}
      />
    </main>
  );
}
