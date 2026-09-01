import { createClient } from '@/shared/lib/supabase/server';
import type {
  Subscription,
  SubscriptionDescription,
} from '@/entities/subscription/types';

const SUBSCRIPTION_COLUMNS =
  'id, name, base_monthly_fee, discount, highlight, description';

// description 안의 키는 snake_case 라 컬럼과 같이 camelCase 로 옮긴다.
interface SubscriptionDescriptionRow {
  image?: string;
  sub_title?: string;
  features?: string[];
}

interface SubscriptionRow {
  id: number;
  name: string;
  base_monthly_fee: number;
  discount: number;
  highlight: string | null;
  description: SubscriptionDescriptionRow | string | null;
}

function mapDescription(
  description: SubscriptionRow['description'],
): SubscriptionDescription | null {
  if (!description || typeof description === 'string') return null;

  return {
    image: description.image,
    subTitle: description.sub_title,
    features: description.features,
  };
}

function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    baseMonthlyFee: row.base_monthly_fee,
    discount: row.discount,
    highlight: row.highlight,
    description: mapDescription(row.description),
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
