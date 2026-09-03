import { createClient } from '@/shared/lib/supabase/server';
import type { AddOn, AddOnDescription } from '@/entities/addOn/types';

const ADD_ON_COLUMNS = 'id, title, sub_title, base_monthly_rate, description';

interface AddOnRow {
  id: number;
  title: string;
  sub_title: string;
  base_monthly_rate: number;
  description: AddOnDescription | string | null;
}

// description 은 실제로는 문자열로 오는 경우가 섞여 있어, 그 경우 안내문으로 다룬다.
function mapAddOnRow(row: AddOnRow): AddOn {
  const description =
    typeof row.description === 'string'
      ? { guide: row.description }
      : row.description;

  return {
    id: row.id,
    title: row.title,
    subTitle: row.sub_title,
    baseMonthlyRate: row.base_monthly_rate,
    description: description ?? null,
  };
}

// 전체 부가서비스 목록
export async function getAllAddOns(): Promise<AddOn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('add_ons')
    .select(ADD_ON_COLUMNS)
    .order('base_monthly_rate', { ascending: true })
    .overrideTypes<AddOnRow[], { merge: false }>();

  if (error) {
    throw new Error(`부가서비스 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapAddOnRow);
}

/** 번호로 부가서비스를 다시 조회한다 - 가입 카드를 복구할 때 쓴다 */
export async function getAddOnsByIds(ids: number[]): Promise<AddOn[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('add_ons')
    .select(ADD_ON_COLUMNS)
    .in('id', ids)
    .overrideTypes<AddOnRow[], { merge: false }>();

  if (error) {
    throw new Error(`부가서비스 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapAddOnRow);
}

/**
 * 이 회원이 지금 이용 중인 부가서비스 번호들.
 * 같은 서비스를 두 번 신청하는 일을 미리 걸러내는 데 쓴다(COMMON-004) -
 * DB 에도 uq_user_add_ons_active 로 막혀 있지만, 그건 마지막 방어선이라
 * 사용자에게는 오류가 아니라 안내로 알려야 한다.
 */
export async function getActiveAddOnIds(userId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_add_ons')
    .select('add_on_id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .overrideTypes<{ add_on_id: number }[], { merge: false }>();

  if (error) {
    throw new Error(`이용 중인 부가서비스 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row) => row.add_on_id);
}

/**
 * PERSONAL-004: 그 회원이 지금 이용 중인 부가서비스.
 * 가입 내역(user_add_ons)에서 id 만 추린 뒤 실제 값은 add_ons 에서 다시 읽는다 -
 * 화면에 보여줄 제목·요금은 언제나 마스터 테이블 값이어야 하기 때문이다(CARD-001).
 */
export async function getUserActiveAddOns(userId: string): Promise<AddOn[]> {
  const supabase = await createClient();

  const { data: joined, error: joinedError } = await supabase
    .from('user_add_ons')
    .select('add_on_id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .returns<{ add_on_id: number }[]>();

  if (joinedError) {
    throw new Error(`이용 중인 부가서비스 조회 실패: ${joinedError.message}`);
  }

  const addOnIds = (joined ?? []).map((row) => row.add_on_id);
  if (addOnIds.length === 0) return [];

  const { data, error } = await supabase
    .from('add_ons')
    .select(ADD_ON_COLUMNS)
    .in('id', addOnIds)
    .order('base_monthly_rate', { ascending: true })
    .overrideTypes<AddOnRow[], { merge: false }>();

  if (error) {
    throw new Error(`부가서비스 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapAddOnRow);
}

/**
 * "N%의 고객님이 선택했어요" 배지에 쓰는 실제 채택률.
 * 분모는 전체 회원이 아니라 "부가서비스를 하나라도 쓰고 있는 회원 수"로 잡는다 -
 * 전체 회원 기준이면 부가서비스 자체를 안 쓰는 회원이 대부분이라 모든 항목이
 * 몇 %로만 나와 무의미해지기 때문에, "부가서비스를 쓰는 사람들 중에서"라는
 * 기준으로 상대적 인기를 보여준다. 지어낸 숫자가 아니라 user_add_ons 실 데이터
 * 기반 계산이다(CARD-001과 같은 원칙 - 서버가 계산하고 모델은 문장만 만든다).
 * add_on_id -> 반올림한 퍼센트(0~100) 맵. 아무도 안 쓰고 있으면 빈 맵.
 */
export async function getAddOnAdoptionRates(): Promise<Map<number, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_add_ons')
    .select('user_id, add_on_id')
    .eq('status', 'ACTIVE')
    .overrideTypes<
      { user_id: string; add_on_id: number }[],
      { merge: false }
    >();

  if (error) {
    throw new Error(`부가서비스 채택률 조회 실패: ${error.message}`);
  }

  const rows = data ?? [];
  const totalSubscribers = new Set(rows.map((row) => row.user_id)).size;
  if (totalSubscribers === 0) return new Map();

  const subscribersByAddOn = new Map<number, Set<string>>();
  for (const row of rows) {
    const set = subscribersByAddOn.get(row.add_on_id) ?? new Set<string>();
    set.add(row.user_id);
    subscribersByAddOn.set(row.add_on_id, set);
  }

  return new Map(
    [...subscribersByAddOn.entries()].map(([addOnId, subscribers]) => [
      addOnId,
      Math.round((subscribers.size / totalSubscribers) * 100),
    ]),
  );
}
