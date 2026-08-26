import ChatAvatar from '@/components/chat/ChatAvatar';
import ChatBubble from '@/components/chat/ChatBubble';
import ReadAloudButton from '@/components/chat/ReadAloudButton';

import { cn } from '@/utils/cn';
import type { DateInput } from '@/utils/formatTime';

interface AiMessageProps {
  content: string;
  createdAt?: DateInput;
  isStreaming?: boolean;
  className?: string;
}

export default function AiMessage({
  content,
  createdAt,
  isStreaming = false,
  className,
}: AiMessageProps) {
  return (
    <div className={cn('flex w-full items-start gap-3', className)}>
      <ChatAvatar />

      <div className="flex w-full flex-col items-start gap-1">
        <ChatBubble variant="ai" createdAt={createdAt}>
          {content}
        </ChatBubble>

        {!isStreaming && <ReadAloudButton text={content} />}
      </div>
    </div>
  );
}
