import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type ChatBubbleVariant = 'ai' | 'user';

interface ChatBubbleProps {
  children: ReactNode;
  variant?: ChatBubbleVariant;
  /** 말풍선 우측 하단에 붙는 요소 (읽어주기 버튼 등). 없으면 그리지 않는다 */
  footer?: ReactNode;
  appendClassName?: string;
}

export default function ChatBubble({
  children,
  variant = 'ai',
  footer,
  appendClassName,
}: ChatBubbleProps) {
  const isAi = variant === 'ai';

  return (
    <div
      className={cn(
        'flex max-w-[80%] flex-col gap-2 rounded-3xl px-4 py-3 text-12 leading-fixed text-text-primary',
        isAi
          ? 'rounded-tl-none bg-action-secondary-light'
          : 'rounded-tr-none border border-border-light bg-background-default',
        appendClassName,
      )}
    >
      <div className="wrap-break-word whitespace-pre-wrap">{children}</div>

      {footer && <div className="self-end">{footer}</div>}
    </div>
  );
}
