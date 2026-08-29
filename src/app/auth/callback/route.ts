import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';
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

    return NextResponse.redirect(signupUrl);
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
