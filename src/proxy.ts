import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { SIGNUP_PENDING_COOKIE } from '@/features/auth/lib/signupPending';

// 가입 미완료 상태에서도 접근을 허용할 경로.
// - /auth: 가입을 마치거나(=signup) 인증을 다시 타는 화면들. 여기까지 막으면 빠져나갈 길이 없다.
// - /api: 리다이렉트를 돌려주면 fetch 가 HTML 을 받아 깨진다. 이쪽은 requireMember 가 JSON 으로 막는다.
const SIGNUP_PENDING_ALLOWED_PREFIXES = ['/auth', '/api'];

/**
 * 1) Supabase 세션 갱신 - 서버 컴포넌트는 쿠키를 못 쓰므로 갱신은 여기서만 일어난다.
 * 2) 가입 미완료(SIGNUP_PENDING_COOKIE) 사용자를 /auth/signup 에 붙잡아 둔다.
 *
 * 2번은 쿠키만 보는 '낙관적 필터'다. proxy 는 prefetch 를 포함해 모든 요청에서 돌기 때문에
 * 여기서 DB 를 조회하지 않는다(Next 공식 권장). 실제 판정은 가입 페이지 가드와
 * requireMember 가 users 레코드를 직접 확인해서 내린다.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignupPending = request.cookies.has(SIGNUP_PENDING_COOKIE);

  // 로그아웃·세션 만료로 사용자가 사라졌는데 표식만 남으면 계속 가입 화면으로 튕겨
  // 갇히게 된다. 세션이 없으면 표식부터 정리한다.
  if (!user) {
    if (isSignupPending) response.cookies.delete(SIGNUP_PENDING_COOKIE);

    return response;
  }

  const { pathname } = request.nextUrl;
  const isAllowedPath = SIGNUP_PENDING_ALLOWED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isSignupPending && !isAllowedPath) {
    const signupUrl = new URL('/auth/signup', request.url);
    // 가입을 마치면 원래 가려던 화면으로 이어지게 한다(AUTH-014)
    signupUrl.searchParams.set('next', pathname);

    const redirectResponse = NextResponse.redirect(signupUrl);
    // 위에서 갱신된 세션 쿠키를 새 응답에 그대로 옮겨야 갱신이 유실되지 않는다
    response.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));

    return redirectResponse;
  }

  return response;
}

export const config = {
  // 정적 자원에는 돌 이유가 없다
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
