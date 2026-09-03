import CatalogView from '@/features/catalog/ui/CatalogView';

import { getCatalogData } from '@/features/catalog/server';
import type { CatalogTab } from '@/features/catalog/types';

const VALID_TABS: CatalogTab[] = ['plans', 'addOns', 'subscriptions', 'memberships'];

function toCatalogTab(value: string | undefined): CatalogTab | undefined {
  return VALID_TABS.find((tab) => tab === value);
}

interface CatalogPageProps {
  // CARD-027~028: 채팅의 "둘러보기"처럼, 특정 탭을 미리 선택한 채로 진입시키는 용도.
  searchParams: Promise<{ tab?: string }>;
}

/**
 * 상품·혜택 목록 (DATA-005/011/016/020).
 * 로그인 여부와 무관한 공개 마스터 데이터라 서버에서 받아 화면으로 내려준다.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [catalog, { tab }] = await Promise.all([getCatalogData(), searchParams]);

  return <CatalogView catalog={catalog} initialTab={toCatalogTab(tab)} />;
}
