import Link from 'next/link';

import Drawer from '@/shared/ui/Drawer';

import { MENU_LINKS } from '../config/menuLinks';

const ITEM_CLASS =
  'flex w-full items-center border-b border-border-default py-4 text-16 leading-fixed font-medium text-text-primary';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  // 비로그인 상태에서 로그인 선택 시, 로그인 모달 진입
  onLoginClick?: () => void;
  // 로그인 상태에서 로그아웃 선택 시, 로그아웃 처리
  onLogoutClick?: () => void;
}

export default function SideMenu({
  isOpen,
  onClose,
  isLoggedIn = false,
  onLoginClick,
  onLogoutClick,
}: SideMenuProps) {
  // 이벤트 핸들러: 항목을 고르면 메뉴를 먼저 닫는다
  const handleLoginClick = () => {
    onClose();
    onLoginClick?.();
  };

  const handleLogoutClick = () => {
    onClose();
    onLogoutClick?.();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} ariaLabel="메뉴">
      <nav className="flex-1 overflow-y-auto px-4">
        <button
          type="button"
          onClick={isLoggedIn ? handleLogoutClick : handleLoginClick}
          className={`${ITEM_CLASS} hover:cursor-pointer`}
        >
          {isLoggedIn ? '로그아웃하기' : '로그인하기'}
        </button>

        {MENU_LINKS.map(({ label, href }) => (
          <Link key={href} href={href} onClick={onClose} className={ITEM_CLASS}>
            {label}
          </Link>
        ))}
      </nav>
    </Drawer>
  );
}
