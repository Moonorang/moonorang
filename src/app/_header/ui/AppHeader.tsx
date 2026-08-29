'use client';

import Header from './Header';
import SideMenu from './SideMenu';

import { useHeaderState } from '../model/useHeaderState';

/**
 * 루트 레이아웃에 붙는 헤더. 상태는 useHeaderState 가 갖고, 여기서는 조립만 한다.
 * SideMenu 를 Header 의 자식이 아니라 형제로 두어, Header 를 통과만 하던
 * 로그인 관련 props 의 드릴링을 없앴다.
 */
export default function AppHeader() {
  const {
    isFlowRoute,
    isLoggedIn,
    isMenuOpen,
    openMenu,
    closeMenu,
    goHome,
    goLogin,
    signOut,
  } = useHeaderState();

  return (
    <>
      <Header
        variant={isFlowRoute ? 'back' : 'logo'}
        hasMenu={!isFlowRoute}
        onBackClick={goHome}
        onMenuClick={openMenu}
      />

      <SideMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        isLoggedIn={isLoggedIn}
        onLoginClick={goLogin}
        onLogoutClick={signOut}
      />
    </>
  );
}
