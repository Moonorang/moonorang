import type { ReactNode } from 'react';

import ChatAvatar from '@/features/chat/components/ChatAvatar';
import ChatBubble from '@/features/chat/components/ChatBubble';
import ReadAloudButton from '@/features/chat/components/ReadAloudButton';

import { cn } from '@/shared/utils/cn';

interface AiMessageProps {
  content: string;
  isStreaming?: boolean;
  appendClassName?: string;
  // 말풍선 아래에 붙는 추가 콘텐츠
  children?: ReactNode;
}

export default function AiMessage({
  content,
  isStreaming = false,
  appendClassName,
  children,
}: AiMessageProps) {
  return (
    <div className={cn('flex w-full items-start gap-3', appendClassName)}>
      <ChatAvatar />

      <div className="flex w-full flex-col items-start gap-2">
        {/* 답변이 다 나온 뒤에만 읽어주기를 붙인다 - 말풍선 우측 하단 */}
        <ChatBubble
          variant="ai"
          footer={!isStreaming && <ReadAloudButton text={content} />}
        >
          {content}
        </ChatBubble>

        {children}
      </div>
    </div>
  );
}
