import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

type ButtonVariant =
  'main' | 'secondary' | 'answer' | 'filter' | 'outline' | 'ghost' | 'gradient';
type ButtonRadius = 'sm' | 'md' | 'full';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  radius?: ButtonRadius;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  main: 'bg-primary-red text-neutral-pure-white',
  secondary: 'bg-primary-yellow text-neutral-pure-white',
  answer: 'bg-secondary-light-yellow text-text-main',
  filter: 'bg-neutral-pure-white text-text-secondary border border-border-gray',
  outline: 'border border-border-gray bg-neutral-pure-white text-text-main',
  ghost: 'bg-transparent text-text-main',
  gradient:
    'bg-linear-to-br from-gradient-from to-gradient-to text-neutral-pure-white',
};

const RADIUS_STYLES: Record<ButtonRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  full: 'rounded-full',
};

export default function Button({
  variant = 'main',
  radius = 'md',
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'relative cursor-pointer overflow-hidden px-3 py-2 text-10 transition-colors',
        // 모든 버튼 공통으로 hover시 black/20 덧씌워짐
        'after:pointer-events-none after:absolute after:inset-0 after:bg-black/20 after:opacity-0 after:transition-opacity',
        "after:content-['']",
        'hover:after:opacity-100 disabled:after:opacity-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_STYLES[variant],
        RADIUS_STYLES[radius],
        className,
      )}
      {...props}
    />
  );
}
