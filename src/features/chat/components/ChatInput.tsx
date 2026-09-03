'use client';

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

import { Plus, Send, Square } from 'lucide-react';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPlusOpen?: boolean;
  // + 버튼 클릭
  onPlusClick?: () => void;
  // 응답 생성 중일 때 입력과 전송을 막음
  disabled?: boolean;
  // 지금 응답을 생성하는 중인지 - true일 때만 전송 버튼 자리가 중단 버튼으로
  // 바뀐다. disabled=true인 다른 이유(예: 대화 복구 중)에는 중단할 게 없으므로
  // 그냥 막힌 전송 버튼 그대로 둔다.
  isGenerating?: boolean;
  // CHAT-008: 응답 생성 중 중단 버튼 클릭. isGenerating일 때만 전송 버튼 자리에 뜬다.
  onStop?: () => void;

  isLocked?: boolean;
  placeholder?: string;
  appendClassName?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isPlusOpen = false,
  onPlusClick,
  disabled = false,
  isGenerating = false,
  onStop,
  isLocked = false,
  placeholder = '무너에게 무엇이든 물어보세요!',
  appendClassName,
}: ChatInputProps) {
  const isInputDisabled = disabled || isLocked;
  const canSend = value.trim().length > 0 && !isInputDisabled;

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
        'mx-auto flex w-full max-w-(--width-container) min-w-(--width-container-min) items-center gap-2',
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

      <div className="flex min-w-0 flex-1 items-center rounded-full bg-background-subtle px-4 py-2.5 focus-within:ring-1 focus-within:ring-action-secondary">
        <input
          type="text"
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={isInputDisabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate bg-transparent text-14 text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {isGenerating ? (
        // CHAT-008: 응답 생성 중엔 전송 버튼 자리를 중단 버튼으로 바꾼다.
        // 입력창 자체는 계속 disabled여도, 이 버튼만은 항상 눌러 멈출 수 있어야 한다.
        <Button
          type="button"
          variant="secondary"
          radius="sm"
          size="none"
          onClick={onStop}
          aria-label="응답 생성 중단"
          appendClassName="h-10 w-10 shrink-0"
        >
          <Square size={16} fill="currentColor" aria-hidden />
        </Button>
      ) : (
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
      )}
    </form>
  );
}
