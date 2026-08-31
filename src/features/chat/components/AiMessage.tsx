import type { ReactNode } from 'react';

import ChatAvatar from '@/features/chat/components/ChatAvatar';
import ChatBubble from '@/features/chat/components/ChatBubble';
import ReadAloudButton from '@/features/chat/components/ReadAloudButton';
import TypingIndicator from '@/features/chat/components/TypingIndicator';

import { cn } from '@/shared/utils/cn';
import type { DateInput } from '@/shared/utils/formatTime';

interface AiMessageProps {
  content: string;
  createdAt?: DateInput;
  isStreaming?: boolean;
  appendClassName?: string;
  // 말풍선 아래에 붙는 추가 콘텐츠
  children?: ReactNode;
}

export default function AiMessage({
  content,
  createdAt,
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
        <ChatBubble variant="ai" createdAt={createdAt}>
          {isWaitingForFirstToken ? <TypingIndicator /> : content}
        </ChatBubble>

        {!isStreaming && <ReadAloudButton text={content} />}

        {children}
      </div>
    </div>
  );
}
