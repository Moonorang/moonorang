'use server';

import { createClient } from '@/shared/lib/supabase/server';

import { toIsoBirth } from '@/features/auth/lib/formatUserInput';
import { signupSchema } from '@/features/auth/lib/signupSchema';

export interface SignupActionResult {
  errorMessage?: string;
}

// 추가 정보 입력이 완료된 경우에만 users 레코드를 생성함(AUTH-009)
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

  const { name, currentPlanId, contact, birth, gender } = parsed.data;

  // 중복 제출로 같은 사용자가 두 번 들어와도 한 건만 유지(COMMON-004)
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      name,
      contact,
      current_plan_id: Number(currentPlanId),
      birth: birth === '' ? null : toIsoBirth(birth),
      gender: gender === '' ? null : gender,
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

  return {};
}
