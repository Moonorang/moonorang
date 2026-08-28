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
