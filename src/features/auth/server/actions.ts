'use server';

import { cookies } from 'next/headers';

import { createClient } from '@/shared/lib/supabase/server';

import { toIsoBirth } from '@/features/auth/lib/formatUserInput';
import {
  joinFlowSignupSchema,
  signupSchema,
} from '@/features/auth/lib/signupSchema';
import { SIGNUP_PENDING_COOKIE } from '@/features/auth/lib/signupPending';

export interface SignupActionResult {
  errorMessage?: string;
}

/** users 레코드에 넣을 값 - current_plan_id 는 넘길 때만 건드린다 */
interface UserProfileValues {
  name: string;
  contact: string;
  birth: string;
  gender: 'MALE' | 'FEMALE' | '';
  /** 없으면 아예 안 건드린다 - 새 행이면 null 로 들어가고, 있던 행이면 그대로 둔다 */
  currentPlanId?: string;
}

/**
 * AUTH-009: 회원 정보를 만든다. 두 가입 경로(추가 정보 화면 / 요금제 가입 절차)가
 * 같은 저장을 해야 해서 한 자리에 모았다.
 */
async function upsertUserProfile(
  userId: string,
  { name, contact, birth, gender, currentPlanId }: UserProfileValues,
): Promise<SignupActionResult> {
  const supabase = await createClient();

  // 중복 제출로 같은 사용자가 두 번 들어와도 한 건만 유지(COMMON-004)
  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
      name,
      contact,
      birth: birth === '' ? null : toIsoBirth(birth),
      gender: gender === '' ? null : gender,
      // 키를 아예 빼면 upsert 가 이 컬럼을 안 건드린다 - 이미 요금제를 가진
      // 회원의 값을 덮어쓰지 않기 위함이다
      ...(currentPlanId ? { current_plan_id: Number(currentPlanId) } : {}),
    },
    { onConflict: 'id' },
  );

  // 저장에 실패했는데 성공으로 돌려보내면, users 레코드 없이 화면만 넘어가서
  // 다음 로그인 때 다시 추가 정보 입력으로 튕긴다(AUTH-009).
  if (error) {
    console.error('[signup] users upsert 실패', error);

    return {
      errorMessage:
        '가입 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  // users 레코드가 생겼으므로 가입 미완료 표식을 지운다 - 안 지우면 proxy 가
  // 계속 가입 화면으로 되돌려보낸다.
  (await cookies()).delete(SIGNUP_PENDING_COOKIE);

  return {};
}

// AUTH-006/009: 추가 정보 화면에서 입력이 완료된 경우에만 users 레코드를 생성함
export async function submitSignup(
  values: unknown,
): Promise<SignupActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorMessage: '로그인이 만료되었어요. 다시 로그인해 주세요.' };
  }

  // 클라이언트 검증을 신뢰하지 않고 서버에서 한 번 더 검증
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    return {
      errorMessage:
        parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.',
    };
  }

  return upsertUserProfile(user.id, parsed.data);
}

/**
 * AUTH-008 / CARD-044: 요금제 가입 절차를 밟다 카카오 회원가입으로 넘어온 경우,
 * 추가 정보 화면을 거치지 않고 곧바로 회원 정보를 만든다.
 *
 * 다시 물어볼 것이 없어서 건너뛴다 - 이름·연락처·생년월일·성별은 본인 확인에서
 * 이미 받았고, 남는 항목인 "현재 이용 요금제"는 지금 첫 요금제를 가입하는 중이라
 * 존재하지 않는 값이다. 그 자리는 결제를 마칠 때 completeJoin 이 채운다(CARD-045).
 */
export async function submitJoinFlowSignup(
  values: unknown,
): Promise<SignupActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorMessage: '로그인이 만료되었어요. 다시 로그인해 주세요.' };
  }

  // 클라이언트가 보낸 값을 그대로 믿지 않고 서버에서 한 번 더 검증한다 -
  // 화면을 안 거치고 들어오는 경로라 오히려 여기가 유일한 검증 지점이다.
  const parsed = joinFlowSignupSchema.safeParse(values);

  if (!parsed.success) {
    return {
      errorMessage:
        parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.',
    };
  }

  return upsertUserProfile(user.id, parsed.data);
}

/**
 * 가입을 그만두고 나갈 때 호출한다. 로그아웃 자체는 클라이언트(useAuth)가 하고,
 * httpOnly 쿠키인 가입 미완료 표식은 클라이언트에서 못 지우므로 여기서 지운다.
 */
export async function clearSignupPending(): Promise<void> {
  (await cookies()).delete(SIGNUP_PENDING_COOKIE);
}
