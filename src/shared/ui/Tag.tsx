import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface TagProps {
  children: ReactNode;
  className?: string;
}

export default function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-action-primary-light px-2 py-1 text-10 font-medium text-action-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}
