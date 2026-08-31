import ChatBubble from '@/features/chat/components/ChatBubble';

import { cn } from '@/shared/utils/cn';
import type { DateInput } from '@/shared/utils/formatTime';

interface UserMessageProps {
  content: string;
  createdAt?: DateInput;
  appendClassName?: string;
}

export default function UserMessage({
  content,
  createdAt,
  appendClassName,
}: UserMessageProps) {
  return (
    <div className={cn('flex w-full justify-end', appendClassName)}>
      <ChatBubble variant="user" createdAt={createdAt}>
        {content}
      </ChatBubble>
    </div>
  );
}
