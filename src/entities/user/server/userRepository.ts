import { createClient } from '@/shared/lib/supabase/server';
import { parseDataAllowanceToGb } from '@/entities/plan/lib/format';
import { getPlansByIds } from '@/entities/plan/server/planRepository';
import type { MonthlyUsage, UserProfile } from '@/entities/user/types';

interface UserRow {
  id: string;
  name: string | null;
  contact: string | null;
  current_plan_id: number | null;
  remaining_data: number;
  data_limit: number | null;
  point: number;
}

/**
 * 로그인 사용자의 프로필 + 현재 요금제. 회원가입을 마치지 않은 사용자(users row 없음)면 null.
 * CHAT-010: 상담 문맥에 포함. CARD-023~026: 절약 상담의 "현재 요금제" 기준.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, name, contact, current_plan_id, remaining_data, data_limit, point',
    )
    .eq('id', userId)
    .maybeSingle<UserRow>();

  if (error) {
    throw new Error(`사용자 프로필 조회 실패: ${error.message}`);
  }
  if (!data) return null;

  // plans 테이블 값은 항상 실제 DB 조회로 채운다(CARD-001과 같은 취지) - id만 들고
  // 다니다 화면에 보여줄 때 다시 조회하는 게 아니라, 여기서 한 번에 합쳐서 돌려준다.
  const plans = data.current_plan_id
    ? await getPlansByIds([data.current_plan_id])
    : [];
  const currentPlan = plans[0] ?? null;

  // users.remaining_data/data_limit은 컬럼명과 달리 실제 저장 단위가 GB다.
  // data_limit이 비어있는 경우(시딩 누락 등)를 대비해, 실제 가입 중인 요금제의
  // 제공량으로 채운다 - 지어내는 게 아니라 이미 조회한 실제 plans 값을 그대로 쓰는 것뿐.
  // 요금제 자체가 무제한이면 제공량 상한이 없다는 뜻이라 null을 그대로 둔다.
  const dataLimitGb = (() => {
    if (data.data_limit !== null) return data.data_limit;
    if (!currentPlan) return null;

    const planDataGb = parseDataAllowanceToGb(currentPlan.dataAllowance);
    return Number.isFinite(planDataGb) ? planDataGb : null;
  })();

  return {
    id: data.id,
    name: data.name,
    contact: data.contact,
    currentPlan,
    remainingDataGb: data.remaining_data,
    dataLimitGb,
    point: data.point,
  };
}

const MB_PER_GB = 1024;

interface MonthlyUsageRow {
  billing_month: string;
  /** 컬럼명과 달리(users.remaining_data/data_limit과 같은 함정) 실제 저장 단위는 GB다. */
  data_used_mb: number;
}

/**
 * 최근 N개월(기본 3) 데이터 사용량. CARD-028.
 * billing_month 오름차순(과거→최근)으로 돌려준다 - 차트 x축에 그대로 쓰기 좋게.
 */
/**
 * 지금 이용 중인 요금제 번호만 가볍게 조회한다.
 * getUserProfile 은 plans 조인까지 해서 프로필 전체를 만드는데, "이 요금제를
 * 이미 쓰고 있나"만 물을 때는 그만큼이 필요 없다.
 */
export async function getCurrentPlanId(userId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('current_plan_id')
    .eq('id', userId)
    .maybeSingle<{ current_plan_id: number | null }>();

  if (error) {
    throw new Error(`현재 요금제 조회 실패: ${error.message}`);
  }

  return data?.current_plan_id ?? null;
}

export async function getRecentMonthlyUsage(
  userId: string,
  months = 3,
): Promise<MonthlyUsage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_monthly_usage')
    .select('billing_month, data_used_mb')
    .eq('user_id', userId)
    .order('billing_month', { ascending: false })
    .limit(months)
    .returns<MonthlyUsageRow[]>();

  if (error) {
    throw new Error(`월별 사용량 조회 실패: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => ({
      billingMonth: row.billing_month,
      // GB로 저장된 값을 실제 MB로 변환한다 - MonthlyUsage.dataUsedMb는 이후
      // buildUsageTrend/UsageTrendChart가 전부 진짜 MB로 취급하므로 여기서 맞춰둬야
      // 나머지 파이프라인을 안 건드리고 이 함정 하나만 흡수할 수 있다.
      dataUsedMb: row.data_used_mb * MB_PER_GB,
    }))
    .reverse();
}
