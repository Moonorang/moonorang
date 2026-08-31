'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import { cn } from '@/shared/utils/cn';

interface ChatAvatarProps {
  appendClassName?: string;
}

export default function ChatAvatar({ appendClassName }: ChatAvatarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-action-secondary-light p-1',
        appendClassName,
      )}
    >
      <Image
        src="/images/chat/ai-avatar.png"
        alt="AI 상담원 무너"
        width={40}
        height={40}
        className="h-full w-full object-cover"
        priority
      />
    </motion.div>
  );
}
