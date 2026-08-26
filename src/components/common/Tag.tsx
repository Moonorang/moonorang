import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface TagProps {
  children: ReactNode;
  className?: string;
}

export default function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-secondary-light-red px-2 py-1 text-10 font-medium text-primary-red',
        className,
      )}
    >
      {children}
    </span>
  );
}
