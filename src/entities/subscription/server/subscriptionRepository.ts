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

/**
 * entities/addOn/server의 getAddOnAdoptionRates와 같은 원칙 - "N%의 고객님이
 * 선택했어요" 배지에 쓸 실 채택률. 분모는 전체 회원이 아니라 "구독 상품을 하나라도
 * 쓰는 회원 수"로 잡는다. PAUSED는 결제만 잠깐 멈춘 상태라 여전히 "쓰고 있다"고
 * 보되, CANCELED는 제외한다.
 */
export async function getSubscriptionAdoptionRates(): Promise<Map<number, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('user_id, subscription_id')
    .in('status', ['ACTIVE', 'PAUSED'])
    .overrideTypes<{ user_id: string; subscription_id: number }[], { merge: false }>();

  if (error) {
    throw new Error(`구독 상품 채택률 조회 실패: ${error.message}`);
  }

  const rows = data ?? [];
  const totalSubscribers = new Set(rows.map((row) => row.user_id)).size;
  if (totalSubscribers === 0) return new Map();

  const subscribersBySubscription = new Map<number, Set<string>>();
  for (const row of rows) {
    const set = subscribersBySubscription.get(row.subscription_id) ?? new Set<string>();
    set.add(row.user_id);
    subscribersBySubscription.set(row.subscription_id, set);
  }

  return new Map(
    [...subscribersBySubscription.entries()].map(([subscriptionId, subscribers]) => [
      subscriptionId,
      Math.round((subscribers.size / totalSubscribers) * 100),
    ]),
  );
}
