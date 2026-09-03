import type { ReactNode } from 'react';

import ChatAvatar from '@/features/chat/components/ChatAvatar';
import ChatBubble from '@/features/chat/components/ChatBubble';
import FormattedMessage from '@/features/chat/components/FormattedMessage';
import TypingIndicator from '@/features/chat/components/TypingIndicator';

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
  // 첫 토큰이 아직 안 온 상태(빈 content + 생성 중) - 대기 애니메이션으로 대신 보여준다.
  const isWaitingForFirstToken = isStreaming && content.length === 0;

  return (
    <div className={cn('flex w-full items-start gap-3', appendClassName)}>
      <ChatAvatar />

      <div className="flex w-full flex-col items-start gap-2">
        <ChatBubble variant="ai">
          {isWaitingForFirstToken ? (
            <TypingIndicator />
          ) : (
            <FormattedMessage text={content} />
          )}
        </ChatBubble>

        {children}
      </div>
    </div>
  );
}
