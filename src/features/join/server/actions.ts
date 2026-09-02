'use server';

import { z } from 'zod';

import { createClient } from '@/shared/lib/supabase/server';

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
