import Link from 'next/link';

import { ChevronLeft, Menu } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

type HeaderVariant = 'logo' | 'back';

interface HeaderProps {
  /** 'logo': 서비스 로고 표시, 'back': 뒤로가기 버튼 표시 */
  variant?: HeaderVariant;
  /** 뒤로가기 버튼 선택 시. 어디로 보낼지는 상위(AppHeader)가 정한다 */
  onBackClick?: () => void;
  /** 가입 흐름처럼 이탈을 막아야 하는 화면에서는 false */
  hasMenu?: boolean;
  /** 햄버거 버튼 선택 시. 메뉴 열림 상태는 상위(AppHeader)가 갖는다 */
  onMenuClick?: () => void;
  className?: string;
}

export default function Header({
  variant = 'logo',
  onBackClick,
  hasMenu = true,
  onMenuClick,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-1/2 z-(--z-header) flex h-(--height-header) w-full max-w-(--width-container) -translate-x-1/2 items-center justify-between gap-4 bg-neutral-pure-white px-4 py-3',
        className,
      )}
    >
      {variant === 'back' ? (
        <button
          type="button"
          onClick={onBackClick}
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

      {hasMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
          className="flex h-6 w-6 items-center justify-center text-text-main transition-colors hover:cursor-pointer hover:text-primary-red"
        >
          <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
