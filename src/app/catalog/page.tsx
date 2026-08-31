import CatalogView from '@/features/catalog/ui/CatalogView';

import { getCatalogData } from '@/features/catalog/server';

/**
 * 상품·혜택 목록 (DATA-005/011/016/020).
 * 로그인 여부와 무관한 공개 마스터 데이터라 서버에서 받아 화면으로 내려준다.
 */
export default async function CatalogPage() {
  const catalog = await getCatalogData();

  return <CatalogView catalog={catalog} />;
}
