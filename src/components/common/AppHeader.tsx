'use client';

import { usePathname, useRouter } from 'next/navigation';

import Header from '@/components/common/Header';

import { useAuth } from '@/hooks/useAuth';

// 가입 흐름처럼 이탈을 막아야 하는 화면: 로고/메뉴 대신 홈으로 나가는 버튼만 노출
const FLOW_ROUTES = ['/auth/signup'];

export default function AppHeader() {
  // 1. 상태 및 훅
  const { isLoggedIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isFlowRoute = FLOW_ROUTES.includes(pathname);

  // 2. 이벤트 핸들러
  const handleLoginClick = () => {
    router.push('/auth/login');
  };

  const handleBackClick = () => {
    router.push('/');
  };

  // 3. 렌더링
  return (
    <Header
      variant={isFlowRoute ? 'back' : 'logo'}
      hasMenu={!isFlowRoute}
      onBackClick={isFlowRoute ? handleBackClick : undefined}
      isLoggedIn={isLoggedIn}
      onLoginClick={handleLoginClick}
      onLogoutClick={signOut}
    />
  );
}
