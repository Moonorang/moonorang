import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';
import {
  SIGNUP_PENDING_COOKIE,
  SIGNUP_PENDING_COOKIE_OPTIONS,
} from '@/features/auth/lib/signupPending';
import { hasUserProfile } from '@/features/auth/server/currentUser';
import { createClient } from '@/shared/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextPath = resolveNextPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  // 회원 정보가 없으면 추가 정보 입력을 거쳐야 users 레코드가 생성됨(AUTH-006, AUTH-009)
  if (!(await hasUserProfile(data.user.id))) {
    const signupUrl = new URL('/auth/signup', origin);
    signupUrl.searchParams.set('next', nextPath);

    const response = NextResponse.redirect(signupUrl);
    // 가입을 마칠 때까지 다른 화면으로 새지 않도록 proxy 가 볼 표식을 남긴다
    response.cookies.set(
      SIGNUP_PENDING_COOKIE,
      '1',
      SIGNUP_PENDING_COOKIE_OPTIONS,
    );

    return response;
  }

  const response = NextResponse.redirect(`${origin}${nextPath}`);
  // 이전 시도에서 남았을 수 있는 표식 정리
  response.cookies.delete(SIGNUP_PENDING_COOKIE);

  return response;
}
