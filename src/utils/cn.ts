import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['10', '12', '14', '16', '18', '20', '32'] }],
    },
  },
});

// Tailwind 클래스를 조건부로 합치고 충돌하는 클래스는 뒤에 오는 값으로 정리
// 예: cn('p-2', isActive && 'bg-secondary-light-yellow', className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
