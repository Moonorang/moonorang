import ChatBubble from '@/features/chat/components/ChatBubble';

import { cn } from '@/shared/utils/cn';
import type { DateInput } from '@/shared/utils/formatTime';

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
