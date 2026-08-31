import { getAllAddOns } from '@/entities/addOn/server';
import { getAllMembershipBrands } from '@/entities/membershipBrand/server';
import { getAllPlans } from '@/entities/plan/server';
import { getAllSubscriptions } from '@/entities/subscription/server';
import type { CatalogData } from '@/features/catalog/types';

/**
 * 목록 화면에 필요한 마스터 데이터 4종(DATA-005/011/016/020)을 한 번에 읽는다.
 * 서로 의존이 없어 병렬로 부르고, 하나라도 실패하면 그대로 던져 error.tsx 가 받는다(COMMON-002).
 */
export async function getCatalogData(): Promise<CatalogData> {
  const [plans, addOns, subscriptions, memberships] = await Promise.all([
    getAllPlans(),
    getAllAddOns(),
    getAllSubscriptions(),
    getAllMembershipBrands(),
  ]);

  return { plans, addOns, subscriptions, memberships };
}
