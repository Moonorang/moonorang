import { createClient } from '@/shared/lib/supabase/server';
import type { Subscription } from '@/entities/subscription/types';

const SUBSCRIPTION_COLUMNS = 'id, name, base_monthly_fee, discount, highlight';

interface SubscriptionRow {
  id: number;
  name: string;
  base_monthly_fee: number;
  discount: number;
  highlight: string | null;
}

function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    baseMonthlyFee: row.base_monthly_fee,
    discount: row.discount,
    highlight: row.highlight,
  };
}

// 전체 구독 상품 목록
export async function getAllSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .order('base_monthly_fee', { ascending: true })
    .overrideTypes<SubscriptionRow[], { merge: false }>();

  if (error) {
    throw new Error(`구독 상품 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapSubscriptionRow);
}
