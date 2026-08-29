import type { ReactNode } from 'react';

import ChatAvatar from '@/features/chat/components/ChatAvatar';
import ChatBubble from '@/features/chat/components/ChatBubble';
import ReadAloudButton from '@/features/chat/components/ReadAloudButton';

import { cn } from '@/shared/utils/cn';
import type { DateInput } from '@/shared/utils/formatTime';

interface AiMessageProps {
  content: string;
  createdAt?: DateInput;
  isStreaming?: boolean;
  className?: string;
  // 말풍선 아래에 붙는 추가 콘텐츠
  children?: ReactNode;
}

export default function AiMessage({
  content,
  createdAt,
  isStreaming = false,
  className,
  children,
}: AiMessageProps) {
  return (
    <div className={cn('flex w-full items-start gap-3', className)}>
      <ChatAvatar />

      <div className="flex w-full flex-col items-start gap-2">
        <ChatBubble variant="ai" createdAt={createdAt}>
          {content}
        </ChatBubble>

        {!isStreaming && <ReadAloudButton text={content} />}

        {children}
      </div>
    </div>
  );
}
