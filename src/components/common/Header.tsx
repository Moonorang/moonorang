'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronLeft, Menu } from 'lucide-react';

import SideMenu from '@/components/common/SideMenu';

import { cn } from '@/utils/cn';

type HeaderVariant = 'logo' | 'back';

interface HeaderProps {
  /** 'logo': 서비스 로고 표시, 'back': 뒤로가기 버튼 표시 */
  variant?: HeaderVariant;
  /** 미지정 시 브라우저 히스토리 뒤로가기 */
  onBackClick?: () => void;
  isLoggedIn?: boolean;
  /** 사이드 메뉴에서 '로그인' 선택 시 (로그인 모달 진입) */
  onLoginClick?: () => void;
  /** 사이드 메뉴에서 '로그아웃' 선택 시 */
  onLogoutClick?: () => void;
  className?: string;
}

export default function Header({
  variant = 'logo',
  onBackClick,
  isLoggedIn = false,
  onLoginClick,
  onLogoutClick,
  className,
}: HeaderProps) {
  // 1. 상태 및 훅
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // 2. 이벤트 핸들러
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    router.back();
  };

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  // 3. 렌더링
  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-1/2 z-(--z-header) flex h-(--height-header) w-full max-w-(--width-container) -translate-x-1/2 items-center justify-between gap-4 bg-neutral-off-white px-4 py-3',
          className,
        )}
      >
        {variant === 'back' ? (
          <button
            type="button"
            onClick={handleBackClick}
            aria-label="이전 화면으로 이동"
            className="flex h-6 w-6 items-center justify-center text-text-secondary transition-colors hover:cursor-pointer hover:text-text-main"
          >
            <ChevronLeft size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="무너랑 홈으로 이동"
            className="font-display text-18 leading-none tracking-tight"
          >
            <span className="text-primary-yellow">
              <span className="text-20">M</span>oono
            </span>
            <span className="text-primary-red">rang</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleMenuClick}
          aria-label="메뉴 열기"
          className="flex h-6 w-6 items-center justify-center text-text-main transition-colors hover:cursor-pointer hover:text-primary-red"
        >
          <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        isLoggedIn={isLoggedIn}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
      />
    </>
  );
}
