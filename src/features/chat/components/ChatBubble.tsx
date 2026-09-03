import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type ChatBubbleVariant = 'ai' | 'user';

interface ChatBubbleProps {
  children: ReactNode;
  variant?: ChatBubbleVariant;
  appendClassName?: string;
}

export default function ChatBubble({
  children,
  variant = 'ai',
  appendClassName,
}: ChatBubbleProps) {
  const isAi = variant === 'ai';

  return (
    <div
      className={cn(
        // 모바일에서는 부모 폭의 80%로 자연스럽게 줄어들되, 넓은 화면(--width-container
        // 캡까지)에서는 80%가 그대로 늘어나면 한 줄이 너무 길어져 12px 글자로는 읽기
        // 불편해진다 - min()으로 440px(약 40자 안팎)을 절대 상한으로 같이 건다.
        'max-w-[min(80%,440px)] rounded-sm px-4 py-3 text-14 leading-fixed text-text-primary',
        isAi
          ? 'rounded-tl-none bg-action-secondary-light'
          : 'rounded-tr-none border border-border-light bg-background-default',
        appendClassName,
      )}
    >
      <div className="wrap-break-word whitespace-pre-wrap">{children}</div>
    </div>
  );
}
