'use server';

import { z } from 'zod';

import { getActiveAddOnIds } from '@/entities/addOn/server';
import { getActiveSubscriptionIds } from '@/entities/subscription/server';
import { getNextBillingDate, toIsoDate } from '@/features/join/lib/billing';
import { createClient } from '@/shared/lib/supabase/server';

/** PostgreSQL unique 제약 위반 - 부분 unique index 로 막아둔 중복 신청이 여기로 온다 */
const UNIQUE_VIOLATION_CODE = '23505';

const completeSubscriptionJoinSchema = z.object({
  /** 신청한 구독 상품 */
  subscriptionId: z.number().int().positive(),
});

const completeAddOnJoinSchema = z.object({
  /** 신청한 부가서비스 */
  addOnId: z.number().int().positive(),
});

const completeJoinSchema = z.object({
  /** 가입한 요금제 */
  planId: z.number().int().positive(),
  /**
   * 본인 확인에서 뽑아낸 성별과 생년월일. 둘 다 모를 수 있어서(아직 본인 확인
   * 전이거나 값이 화면에서 사라진 경우) 없으면 그 컬럼은 건드리지 않는다.
   */
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export interface CompleteJoinResult {
  errorMessage?: string;
}

/**
 * CARD-045: 요금제 가입이 확정되는 자리 - 현재 이용 요금제를 방금 가입한 것으로
 * 바꾼다. CARD-036 에서 뽑아낸 성별·생년월일도 같은 update 에 실어 한 번에 남긴다.
 *
 * 서버로 올라오는 개인정보는 성별과 생년월일뿐이다 - 주민등록번호는 뒷자리 첫
 * 숫자조차 보내지 않는다. 그 한 자리에서 성별과 출생 세기를 읽어내는 일은 화면에서
 * 끝내고 결과만 넘기면 되기 때문이다. (뒤 6자리는 아예 입력받지도 않는다)
 *
 * users 레코드는 회원가입(AUTH-009)에서 이미 만들어져 있으므로 update 만 한다 -
 * 비회원은 결제 전에 카카오 회원가입으로 빠지므로(CARD-044) 여기까지 오지 않는다.
 */
export async function completeJoin(
  input: unknown,
): Promise<CompleteJoinResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorMessage: '로그인이 만료되었어요. 다시 로그인해 주세요.' };
  }

  // 클라이언트 검증을 신뢰하지 않고 서버에서 한 번 더 확인
  const parsed = completeJoinSchema.safeParse(input);

  if (!parsed.success) {
    return { errorMessage: '가입 정보를 확인하지 못했어요.' };
  }

  const { planId, gender, birth } = parsed.data;

  // 바꾼 행을 돌려받아, 오류 없이 한 행도 안 바뀐 경우(회원 정보가 없는 경우)를 가른다.
  // 그냥 넘기면 요금제는 그대로인데 화면에는 가입 완료가 뜬다.
  const { data, error } = await supabase
    .from('users')
    .update({
      current_plan_id: planId,
      ...(gender ? { gender } : {}),
      ...(birth ? { birth } : {}),
    })
    .eq('id', user.id)
    .select('id');

  if (error) {
    console.error('[join] 가입 정보 저장 실패', error);

    return {
      errorMessage:
        '가입 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (!data || data.length === 0) {
    return { errorMessage: '회원 정보를 찾지 못했어요. 다시 로그인해 주세요.' };
  }

  return {};
}

/**
 * DATA-010/012: 부가서비스 신청이 확정되는 자리 - user_add_ons 에 이용 내역을 남긴다.
 *
 * 요금제(completeJoin)가 users 한 행을 고치는 것과 달리 이쪽은 행을 새로 넣는다.
 * 그래서 두 번 눌리면 두 건이 쌓일 수 있어 확인이 한 겹 더 필요하다:
 * 먼저 이미 이용 중인지 조회해 안내로 돌려보내고, 그 사이에 들어온 요청은
 * uq_user_add_ons_active 가 막는다(23505) - 그 오류도 같은 안내로 바꿔 돌려준다.
 *
 * started_at 은 기본값(오늘)에 맡긴다. 일할 계산의 기준일은 서버가 정해야 하는
 * 값이라 클라이언트가 보낸 날짜를 쓰지 않는다.
 */
export async function completeAddOnJoin(
  input: unknown,
): Promise<CompleteJoinResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorMessage: '로그인이 만료되었어요. 다시 로그인해 주세요.' };
  }

  const parsed = completeAddOnJoinSchema.safeParse(input);

  if (!parsed.success) {
    return { errorMessage: '신청 정보를 확인하지 못했어요.' };
  }

  const { addOnId } = parsed.data;

  const activeAddOnIds = await getActiveAddOnIds(user.id);
  if (activeAddOnIds.includes(addOnId)) {
    return { errorMessage: '이미 이용 중인 부가서비스예요.' };
  }

  const { error } = await supabase
    .from('user_add_ons')
    .insert({ user_id: user.id, add_on_id: addOnId });

  if (error) {
    // 같은 순간에 두 번 들어온 경우 - 결과적으로는 이미 이용 중인 것이 맞다
    if (error.code === UNIQUE_VIOLATION_CODE) {
      return { errorMessage: '이미 이용 중인 부가서비스예요.' };
    }

    console.error('[join] 부가서비스 신청 저장 실패', error);

    return {
      errorMessage:
        '신청 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  return {};
}

/**
 * DATA-015/017: 구독 신청이 확정되는 자리 - user_subscriptions 에 내역을 남긴다.
 *
 * 중복을 두 겹으로 막는 것은 부가서비스(completeAddOnJoin)와 같다. 다른 점은
 * 기준이 ACTIVE 가 아니라 "해지되지 않은 것"이라는 점이다 - 잠시 멈춘(PAUSED)
 * 구독도 다시 신청할 수는 없고, uq_user_subscriptions_active 도 같은 기준이다.
 *
 * next_billing_date 는 NOT NULL 이라 반드시 채워야 하는데, 결제일은 서버가 정해야
 * 하는 값이라 클라이언트가 보낸 날짜를 쓰지 않는다.
 */
export async function completeSubscriptionJoin(
  input: unknown,
): Promise<CompleteJoinResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorMessage: '로그인이 만료되었어요. 다시 로그인해 주세요.' };
  }

  const parsed = completeSubscriptionJoinSchema.safeParse(input);

  if (!parsed.success) {
    return { errorMessage: '신청 정보를 확인하지 못했어요.' };
  }

  const { subscriptionId } = parsed.data;

  const activeSubscriptionIds = await getActiveSubscriptionIds(user.id);
  if (activeSubscriptionIds.includes(subscriptionId)) {
    return { errorMessage: '이미 이용 중인 구독 상품이에요.' };
  }

  const { error } = await supabase.from('user_subscriptions').insert({
    user_id: user.id,
    subscription_id: subscriptionId,
    next_billing_date: toIsoDate(getNextBillingDate(new Date())),
  });

  if (error) {
    // 같은 순간에 두 번 들어온 경우 - 결과적으로는 이미 이용 중인 것이 맞다
    if (error.code === UNIQUE_VIOLATION_CODE) {
      return { errorMessage: '이미 이용 중인 구독 상품이에요.' };
    }

    console.error('[join] 구독 신청 저장 실패', error);

    return {
      errorMessage:
        '신청 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  return {};
}
