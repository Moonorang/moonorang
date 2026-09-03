import type { User } from '@supabase/supabase-js';

import { createClient } from '@/shared/lib/supabase/server';

// 현재 요청의 로그인 사용자. 비로그인이면 null.
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * users 레코드가 있는지 = 추가 정보 입력까지 마친 회원인지(AUTH-005, AUTH-009).
 * auth.users 에만 있고 users 에 없으면 아직 가입이 끝나지 않은 상태다.
 */
export async function hasUserProfile(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  return Boolean(data);
}

export type MemberGuardReason = 'guest' | 'incomplete_profile';

export type MemberGuardResult =
  | { isMember: true; user: User }
  | { isMember: false; reason: MemberGuardReason };

export const MEMBER_GUARD_MESSAGE: Record<MemberGuardReason, string> = {
  guest: '로그인이 필요합니다.',
  incomplete_profile: '추가 정보 입력을 마쳐야 이용할 수 있습니다.',
};

export const MEMBER_GUARD_STATUS: Record<MemberGuardReason, number> = {
  guest: 401,
  incomplete_profile: 403,
};

/**
 * 회원 전용 처리의 관문. 카카오 인증만 끝나고 users 레코드가 없는 '반쪽 상태'를
 * 회원으로 취급하지 않는다 - chats.user_id 등이 public.users 를 참조하는 FK 라,
 * 이 상태로 회원용 쓰기에 들어가면 외래키 위반으로 실패한다.
 *
 * proxy 는 쿠키만 보는 낙관적 필터라 사용자가 쿠키를 지우면 통과할 수 있다.
 * 실제 판정은 여기서 users 레코드를 직접 확인해서 내린다.
 */
export async function requireMember(): Promise<MemberGuardResult> {
  const user = await getCurrentUser();

  if (!user) return { isMember: false, reason: 'guest' };

  if (!(await hasUserProfile(user.id))) {
    return { isMember: false, reason: 'incomplete_profile' };
  }

  return { isMember: true, user };
}
