import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';
import { formatMessageTime, type DateInput } from '@/shared/utils/formatTime';

type ChatBubbleVariant = 'ai' | 'user';

interface ChatBubbleProps {
  children: ReactNode;
  variant?: ChatBubbleVariant;
  createdAt?: DateInput;
  className?: string;
}

export default function ChatBubble({
  children,
  variant = 'ai',
  createdAt,
  className,
}: ChatBubbleProps) {
  const isAi = variant === 'ai';
  const time = createdAt === undefined ? null : formatMessageTime(createdAt);

  return (
    <div
      className={cn(
        'flex max-w-[80%] flex-col gap-2 rounded-md px-4 py-3 text-12 leading-fixed text-text-main',
        isAi
          ? 'rounded-tl-none bg-secondary-light-yellow'
          : 'rounded-tr-none bg-border-light-gray',
        className,
      )}
    >
      <div className="wrap-break-word whitespace-pre-wrap">{children}</div>

      {time && (
        <time
          dateTime={time.dateTime}
          className="self-end text-10 text-text-secondary"
        >
          {time.label}
        </time>
      )}
    </div>
  );
}
