'use client';

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

import { Mic, Plus, Send } from 'lucide-react';

import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';

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
  className?: string;
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
  className,
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
        'border-t border-border-gray bg-neutral-pure-white px-4 py-2',
        className,
      )}
    >
      <Button
        variant="ghost"
        onClick={onPlusClick}
        aria-label="추가 기능 열기"
        className={cn(
          'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm p-0',
          isPlusOpen
            ? 'bg-secondary-light-yellow text-primary-yellow'
            : 'text-text-secondary',
        )}
      >
        <Plus size={20} aria-hidden />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-neutral-off-white px-4 py-2.5 focus-within:ring-1 focus-within:ring-border-gray">
        <input
          type="text"
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate bg-transparent text-12 text-text-main placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={onMicClick}
          disabled={disabled}
          aria-label="음성으로 입력"
          className="flex shrink-0 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:text-primary-red disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mic size={20} aria-hidden />
        </button>
      </div>

      <Button
        type="submit"
        variant="secondary"
        disabled={!canSend}
        aria-label="메시지 보내기"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm p-0 text-neutral-pure-white transition-colors',
          !canSend && 'bg-text-gray',
        )}
      >
        <Send size={18} aria-hidden />
      </Button>
    </form>
  );
}
