'use client';

import Header from './Header';

import { useHeaderState } from '../model/useHeaderState';

/**
 * 루트 레이아웃에 붙는 헤더. 상태는 useHeaderState 가 갖고, 여기서는 조립만 한다.
 */
export default function AppHeader() {
  const { isFlowRoute, isLoggedIn, goBack, goLogin, signOut } = useHeaderState();

  return (
    <Header
      variant={isFlowRoute ? 'back' : 'logo'}
      hasActions={!isFlowRoute}
      onBackClick={goBack}
      isLoggedIn={isLoggedIn}
      onLoginClick={goLogin}
      onLogoutClick={signOut}
    />
  );
}
