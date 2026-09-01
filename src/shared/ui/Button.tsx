import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

type ButtonVariant =
  'main' | 'secondary' | 'answer' | 'filter' | 'outline' | 'ghost' | 'gradient';
type ButtonRadius = 'sm' | 'md' | 'full';
// 패딩 + 글자 크기를 한 토큰으로
type ButtonSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonGap = 'sm' | 'md';

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  variant?: ButtonVariant;
  radius?: ButtonRadius;
  size?: ButtonSize;
  gap?: ButtonGap;
  isFullWidth?: boolean;
  isActive?: boolean;
  appendClassName?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  main: 'bg-action-primary text-background-default',
  secondary: 'bg-action-secondary text-background-default',
  answer: 'bg-action-secondary-light text-text-primary shadow-default',
  filter:
    'bg-background-default text-text-secondary border border-border-default',
  outline: 'border border-border-default bg-background-default text-text-primary',
  ghost: 'bg-transparent text-text-primary',
  gradient:
    'bg-linear-to-br from-gradient-from to-gradient-to text-background-default',
};

const RADIUS_STYLES: Record<ButtonRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  full: 'rounded-full',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  none: 'p-0',
  sm: 'px-2 py-1 text-10',
  md: 'px-3 py-2 text-10',
  lg: 'px-4 py-2.5 text-12',
  xl: 'px-4 py-3 text-14 font-bold',
};

const GAP_STYLES: Record<ButtonGap, string> = {
  sm: 'gap-1',
  md: 'gap-2',
};

export default function Button({
  variant = 'main',
  radius = 'md',
  size = 'md',
  gap,
  isFullWidth = false,
  isActive = false,
  appendClassName,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center overflow-hidden font-medium transition-colors',
        // 모든 버튼 공통으로 hover시 black/20 덧씌워짐
        'after:pointer-events-none after:absolute after:inset-0 after:bg-black/20 after:opacity-0 after:transition-opacity',
        "after:content-['']",
        'hover:after:opacity-100 disabled:after:opacity-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_STYLES[variant],
        RADIUS_STYLES[radius],
        SIZE_STYLES[size],
        gap && GAP_STYLES[gap],
        isFullWidth && 'w-full',
        // ghost variant의 토글 강조 - 예: 채팅 입력창의 + 버튼이 열려 있을 때
        isActive && 'bg-action-secondary-light text-action-secondary',
        appendClassName,
      )}
      {...props}
    />
  );
}
