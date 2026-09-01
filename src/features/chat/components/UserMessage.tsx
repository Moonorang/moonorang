import ChatBubble from '@/features/chat/components/ChatBubble';

import { cn } from '@/shared/utils/cn';

interface UserMessageProps {
  content: string;
  appendClassName?: string;
}

export default function UserMessage({
  content,
  appendClassName,
}: UserMessageProps) {
  return (
    <div className={cn('flex w-full justify-end', appendClassName)}>
      <ChatBubble variant="user">{content}</ChatBubble>
    </div>
  );
}
