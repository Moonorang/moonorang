import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스를 조건부로 합치고, 충돌하는 클래스는 뒤에 오는 값으로 정리해줍니다.
 * 예: cn('p-2', isActive && 'bg-amber-50', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
