'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { clearSignupPending } from '@/features/auth/server/actions';

import {
  AUTH_REQUIRED_ROUTES,
  FLOW_ROUTES,
  HISTORY_BACK_ROUTES,
  SIGNOUT_EXIT_ROUTES,
} from '../config/flowRoutes';

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

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isExitConfirmRequired = matchesRoute(SIGNOUT_EXIT_ROUTES, pathname);

  /**
   * 나가기 동작.
   * - 가입 미완료 화면: 바로 내보내지 않고 확인부터 받는다(아래 confirmExit)
   * - 직전 화면으로 돌아갈 화면: 히스토리를 되감는다. 새 탭 등으로 바로 들어와
   *   되감을 이력이 없으면 홈으로 대체한다
   * - 그 외: 홈으로
   */
  const requestExit = useCallback(() => {
    if (isExitConfirmRequired) {
      setIsExitConfirmOpen(true);
      return;
    }

    const hasHistory =
      typeof window !== 'undefined' && window.history.length > 1;

    if (matchesRoute(HISTORY_BACK_ROUTES, pathname) && hasHistory) {
      router.back();
      return;
    }

    router.push('/');
  }, [isExitConfirmRequired, pathname, router]);

  const cancelExit = useCallback(() => setIsExitConfirmOpen(false), []);

  /**
   * 가입을 그만두고 나간다. 인증 세션과 가입 미완료 표식을 함께 지워서,
   * '로그인은 됐는데 회원 정보는 없는' 상태가 남지 않게 한다.
   */
  const confirmExit = useCallback(async () => {
    // COMMON-004: 처리 중 중복 실행 차단
    if (isExiting) return;
    setIsExiting(true);

    try {
      await signOut();
      await clearSignupPending();

      setIsExitConfirmOpen(false);
      router.replace('/');
      router.refresh();
    } finally {
      setIsExiting(false);
    }
  }, [isExiting, router, signOut]);

  /**
   * 로그아웃. 마이페이지처럼 로그인해야 볼 수 있는 화면에서 나가면 그 자리에 남을
   * 수 없으므로 홈으로 보낸다 - 서버에서 이미 그려진 회원 정보가 화면에 그대로
   * 남아 있는 것을 막는다(PERSONAL-002). 그 외 화면은 자리를 지키되, 서버
   * 컴포넌트가 비로그인 기준으로 다시 그려지도록 새로고침만 한다.
   */
  const logout = useCallback(async () => {
    // COMMON-004: 처리 중 중복 실행 차단
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await signOut();

      if (matchesRoute(AUTH_REQUIRED_ROUTES, pathname)) {
        router.replace('/');
      }

      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, pathname, router, signOut]);

  // AUTH-014: 지금 보던 화면을 next 로 넘겨 로그인 후 되돌아오게 한다
  const goLogin = useCallback(() => {
    const query =
      pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;

    router.push(`/auth/login${query}`);
  }, [router, pathname]);

  return {
    // 하위 경로(/auth/signup/terms 등)도 같은 흐름으로 취급한다
    isFlowRoute: matchesRoute(FLOW_ROUTES, pathname),
    isExitConfirmRequired,
    isLoggedIn,
    isExitConfirmOpen,
    isExiting,
    requestExit,
    cancelExit,
    confirmExit,
    goLogin,
    logout,
  };
}
