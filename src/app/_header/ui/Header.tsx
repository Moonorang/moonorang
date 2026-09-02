import Link from 'next/link';

import { ChevronLeft, LogIn, LogOut } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

import { HEADER_LINKS } from '../config/headerLinks';

type HeaderVariant = 'logo' | 'back';

// 항목이 전부 아이콘이라 글자 크기 대신 색과 클릭 영역만 정한다
const ACTION_CLASS =
  'flex h-6 w-6 items-center justify-center text-text-primary transition-colors hover:text-action-primary';

interface HeaderProps {
  /** 'logo': 서비스 로고 표시, 'back': 뒤로가기 버튼 표시 */
  variant?: HeaderVariant;
  /** 뒤로가기 버튼 선택 시. 어디로 보낼지는 상위(AppHeader)가 정한다 */
  onBackClick?: () => void;
  /** 뒤로가기 버튼의 스크린리더 라벨. 화면에 따라 '이동'이 아닐 수 있다 */
  backLabel?: string;
  /** 가입 흐름처럼 이탈을 막아야 하는 화면에서는 false */
  hasActions?: boolean;
  /** HEADER-002: 로그인 여부에 따라 우측 항목을 분기한다 */
  isLoggedIn?: boolean;
  /** 비로그인 상태에서 로그인 선택 시, 로그인 화면 진입 */
  onLoginClick?: () => void;
  /** 로그인 상태에서 로그아웃 선택 시, 로그아웃 처리 */
  onLogoutClick?: () => void;
  appendClassName?: string;
}

export default function Header({
  variant = 'logo',
  onBackClick,
  backLabel = '이전 화면으로 이동',
  hasActions = true,
  isLoggedIn = false,
  onLoginClick,
  onLogoutClick,
  appendClassName,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-1/2 z-(--z-header) flex h-(--height-header) w-full -translate-x-1/2 items-center justify-between gap-4 border-b border-b-border-light bg-background-default px-4 py-3',
        appendClassName,
      )}
    >
      {variant === 'back' ? (
        <button
          type="button"
          onClick={onBackClick}
          aria-label={backLabel}
          className="flex h-6 w-6 items-center justify-center text-text-secondary transition-colors hover:cursor-pointer hover:text-text-primary"
        >
          <ChevronLeft size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : (
        <Link
          href="/"
          aria-label="무너랑 홈으로 이동"
          className="font-display text-18 leading-none tracking-tight"
        >
          <span className="text-action-secondary">
            <span className="text-20">M</span>oono
          </span>
          <span className="text-action-primary">rang</span>
        </Link>
      )}

      {hasActions && (
        <nav className="flex items-center gap-4">
          {HEADER_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={ACTION_CLASS}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
            </Link>
          ))}

          <button
            type="button"
            onClick={isLoggedIn ? onLogoutClick : onLoginClick}
            aria-label={isLoggedIn ? '로그아웃' : '로그인'}
            className={cn(ACTION_CLASS, 'hover:cursor-pointer')}
          >
            {isLoggedIn ? (
              <LogOut size={20} strokeWidth={1.5} aria-hidden />
            ) : (
              <LogIn size={20} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </nav>
      )}
    </header>
  );
}
