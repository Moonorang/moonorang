'use client';

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

import { Mic, Plus, Send } from 'lucide-react';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPlusOpen?: boolean;
  // + 버튼 클릭
  onPlusClick?: () => void;
  // 마이크 버튼 클릭
  onMicClick?: () => void;
  // 응답 생성 중일 때 입력과 전송을 막음
  disabled?: boolean;
  placeholder?: string;
  appendClassName?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isPlusOpen = false,
  onPlusClick,
  onMicClick,
  disabled = false,
  placeholder = '무너에게 무엇이든 물어보세요!',
  appendClassName,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 조합 중에 Enter 가 눌리면 조합 중인 글자가 끊김
    // 조합이 끝난 뒤의 Enter 만 전송으로 처리
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'fixed inset-x-0 bottom-0 z-(--z-chat-input)',
        'mx-auto flex w-full items-center gap-2',
        'border-t border-border-default bg-background-default px-4 py-2',
        appendClassName,
      )}
    >
      <Button
        variant="ghost"
        radius="sm"
        size="none"
        isActive={isPlusOpen}
        onClick={onPlusClick}
        aria-label="추가 기능 열기"
        appendClassName="h-10 w-10 shrink-0"
      >
        <Plus size={20} aria-hidden />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-background-subtle px-4 py-2.5 focus-within:ring-1 focus-within:ring-action-secondary">
        <input
          type="text"
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate bg-transparent text-12 text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={onMicClick}
          disabled={disabled}
          aria-label="음성으로 입력"
          className="flex shrink-0 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:text-action-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mic size={20} aria-hidden />
        </button>
      </div>

      <Button
        type="submit"
        variant="secondary"
        radius="sm"
        size="none"
        disabled={!canSend}
        aria-label="메시지 보내기"
        appendClassName="h-10 w-10 shrink-0"
      >
        <Send size={18} aria-hidden />
      </Button>
    </form>
  );
}
