import ChatBubble from '@/components/chat/ChatBubble';

import { cn } from '@/utils/cn';
import type { DateInput } from '@/utils/formatTime';

interface UserMessageProps {
  content: string;
  createdAt?: DateInput;
  className?: string;
}

export default function UserMessage({
  content,
  createdAt,
  className,
}: UserMessageProps) {
  return (
    <div className={cn('flex w-full justify-end', className)}>
      <ChatBubble variant="user" createdAt={createdAt}>
        {content}
      </ChatBubble>
    </div>
  );
}
