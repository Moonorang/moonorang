'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface MenuLink {
  label: string;
  href: string;
}

// 실제 라우트 확정 시, 변경 필요
const MENU_LINKS: MenuLink[] = [
  { label: '요금제 목록', href: '/list/plans' },
  { label: '부가서비스 목록', href: '/list/services' },
  { label: '구독 상품 목록', href: '/list/subscriptions' },
];

const ITEM_CLASS =
  'flex w-full items-center border-b border-border-gray py-4 text-16 leading-fixed font-medium text-text-main';

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
  // 부수 효과: 배경 스크롤 차단 및 Escape로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 이벤트 핸들러
  const handleLoginClick = () => {
    onClose();
    onLoginClick?.();
  };

  const handleLogoutClick = () => {
    onClose();
    onLogoutClick?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-(--z-modal)">
          {/* 딤 배경은 컨테이너 폭에 묶이지 않고 화면 전체를 덮음 */}
          <motion.button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          {/* 메뉴 패널만 컨테이너 폭 안에 정렬. 래퍼는 클릭을 통과시켜 배경 닫기를 막지 않음 */}
          <div className="pointer-events-none relative mx-auto h-full w-full max-w-(--width-container)">
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="메뉴"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className="pointer-events-auto absolute top-0 right-0 flex h-full w-[70%] flex-col bg-neutral-pure-white"
            >
              <div className="flex h-(--height-header) items-center justify-end px-4 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="메뉴 닫기"
                  className="flex h-6 w-6 items-center justify-center text-text-main transition-colors hover:cursor-pointer hover:text-primary-red"
                >
                  <X size={24} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4">
                <button
                  type="button"
                  onClick={isLoggedIn ? handleLogoutClick : handleLoginClick}
                  className={`${ITEM_CLASS} hover:cursor-pointer`}
                >
                  {isLoggedIn ? '로그아웃하기' : '로그인하기'}
                </button>

                {MENU_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={ITEM_CLASS}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
