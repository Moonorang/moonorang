'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { FLOW_ROUTES, HISTORY_BACK_ROUTES } from '../config/flowRoutes';

const matchesRoute = (routes: string[], pathname: string) =>
  routes.some((route) => pathname.startsWith(route));

/**
 * 헤더가 그리는 데 필요한 상태와 동작을 한곳에서 만든다.
 * ui/ 는 이 훅이 준 값만 쓰고 useAuth·usePathname 을 직접 부르지 않는다.
 *
 * variant('logo' | 'back') 같은 표현값이 아니라 isFlowRoute 라는 의미값을 돌려주는데,
 * 그래야 model 이 ui 의 타입을 참조하지 않는다 (의미는 model, 표현은 ui).
 */
export function useHeaderState() {
  const { isLoggedIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * 나가기 동작. 직전 화면으로 돌아갈 화면(HISTORY_BACK_ROUTES)에서만 히스토리를 되감고,
   * 그 외에는 홈으로 보낸다. 새 탭 등으로 바로 들어와 되감을 이력이 없으면 홈으로 대체한다.
   */
  const goBack = useCallback(() => {
    const hasHistory =
      typeof window !== 'undefined' && window.history.length > 1;

    if (matchesRoute(HISTORY_BACK_ROUTES, pathname) && hasHistory) {
      router.back();
      return;
    }

    router.push('/');
  }, [router, pathname]);

  // AUTH-014: 지금 보던 화면을 next 로 넘겨 로그인 후 되돌아오게 한다
  const goLogin = useCallback(() => {
    const query =
      pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;

    router.push(`/auth/login${query}`);
  }, [router, pathname]);

  return {
    // 하위 경로(/auth/signup/terms 등)도 같은 흐름으로 취급한다
    isFlowRoute: matchesRoute(FLOW_ROUTES, pathname),
    isLoggedIn,
    goBack,
    goLogin,
    signOut,
  };
}
