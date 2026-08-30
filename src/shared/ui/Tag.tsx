import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface TagProps {
  children: ReactNode;
  /** 배치 전용 탈출구 (self-start 등). 색상 등 디자인은 이 컴포넌트가 고정한다 */
  appendClassName?: string;
}

export default function Tag({ children, appendClassName }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-action-primary-light px-2 py-1 text-10 font-medium text-action-primary',
        appendClassName,
      )}
    >
      {children}
    </span>
  );
}
