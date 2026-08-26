'use client';

import { useRouter } from 'next/navigation';

import Header from '@/components/common/Header';

import { useAuth } from '@/hooks/useAuth';

export default function AppHeader() {
  // 1. 상태 및 훅
  const { isLoggedIn, signOut } = useAuth();
  const router = useRouter();

  // 2. 이벤트 핸들러
  const handleLoginClick = () => {
    router.push('/auth/login');
  };

  // 3. 렌더링
  return (
    <Header
      isLoggedIn={isLoggedIn}
      onLoginClick={handleLoginClick}
      onLogoutClick={signOut}
    />
  );
}
