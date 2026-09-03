'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { ArrowRight, Pencil } from 'lucide-react';

import Button from '@/shared/ui/Button';
import QuestionCard from '@/shared/ui/QuestionCard';
import { cn } from '@/shared/utils/cn';

import { CONDITION_QUESTIONS } from '@/features/chat/data/conditionQuestions';
import type { ChatKeywords } from '@/features/chat/types';

interface ConditionQuestionCardProps {
  currentIndex: number;
  /** 선택지 하이라이트를 keywords 현재값에서 그대로 읽는다 - 별도 답변 상태를 안 둔다 */
  keywords: ChatKeywords;
  onSelect: (
    field: keyof ChatKeywords,
    value: number,
    summaryText: string,
  ) => void;
  /** CARD-011: 직접 입력은 구조화 파싱 없이 일반 채팅 메시지로 그대로 보낸다 */
  onFreeText: (text: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  /**
   * 기타(직접 입력) 칸에 포커스가 가 있는 동안을 알려준다. 이 입력창과 하단
   * 채팅 입력창에 동시에 타이핑하는 것처럼 보이는 상황을 막기 위해, 포커스가
   * 있는 동안은 호출부가 채팅 입력창을 막는 데 쓴다.
   */
  onFreeTextEditingChange?: (isEditing: boolean) => void;
}

/**
 * CARD-008~015: 대화 안에 카드로 뜨는 조건 수집 문항.
 * 공용 QuestionCard에 features/chat 전용 CONDITION_QUESTIONS를 매핑해 넘긴다
 * (features/test의 TestQuestionCard와 같은 패턴 - feature끼리 서로 참조할 수 없어서
 * 각 feature가 자기 문항으로 각자 얇게 감싼다).
 */
export default function ConditionQuestionCard({
  currentIndex,
  keywords,
  onSelect,
  onFreeText,
  onPrev,
  onNext,
  onSkip,
  onClose,
  onFreeTextEditingChange,
}: ConditionQuestionCardProps) {
  // 1. 상태 및 훅
  const [freeText, setFreeText] = useState('');
  const freeTextInputRef = useRef<HTMLInputElement>(null);
  const question = CONDITION_QUESTIONS[currentIndex];
  const selectedValue = keywords[question.keywordField] ?? null;
  const hasFreeText = freeText.trim().length > 0;

  // 문항이 바뀌면(이전/다음) 이전 문항에 쓰던 기타 입력이 남지 않게 비운다.
  // effect가 아니라 렌더 중에 바로 반영한다 - "prop이 바뀌면 상태를 조정"하는
  // 경우는 React가 권장하는 방식대로, 별도 리렌더를 부르는 setState-in-effect
  // 대신 이번 렌더 안에서 바로 처리한다.
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (currentIndex !== prevIndex) {
    setPrevIndex(currentIndex);
    setFreeText('');
  }

  // 2. 부수 효과
  // 카드 자체가 닫혀 사라질 때(X, 마지막 문항 완료) 채팅 입력 잠금이 풀린 채로
  // 남지 않게 한다.
  useEffect(() => {
    return () => onFreeTextEditingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. 이벤트 핸들러
  const handleSelect = (value: number) => {
    const option = question.options.find((item) => item.value === value);
    const summaryText = `${question.summaryLabel}: ${option?.label ?? value}`;

    onSelect(question.keywordField, value, summaryText);
  };

  const submitFreeText = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;

    setFreeText('');
    freeTextInputRef.current?.blur();
    onFreeText(trimmed);
  };

  const handleFreeTextKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitFreeText();
    } else if (event.key === 'Escape') {
      setFreeText('');
      freeTextInputRef.current?.blur();
    }
  };

  // 4. 렌더링
  return (
    <QuestionCard
      title="조건을 알려주시면 더 정확히 추천해드려요"
      imageSrc="/images/chat/ai-avatar.png"
      question={question.question}
      options={question.options}
      currentIndex={currentIndex}
      total={CONDITION_QUESTIONS.length}
      selectedValue={selectedValue}
      onSelect={handleSelect}
      onPrev={onPrev}
      onNext={onNext}
      onSkip={onSkip}
      onClose={onClose}
      hideSkip
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex w-full items-center gap-2 px-1">
          <div
            onClick={() => freeTextInputRef.current?.focus()}
            className={cn(
              'flex min-w-0 flex-1 cursor-text items-center gap-2',
              hasFreeText && '',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-border-default text-text-primary',
              )}
            >
              <Pencil size={12} aria-hidden />
            </span>
            <input
              ref={freeTextInputRef}
              type="text"
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              onFocus={() => onFreeTextEditingChange?.(true)}
              onBlur={() => onFreeTextEditingChange?.(false)}
              onKeyDown={handleFreeTextKeyDown}
              placeholder="직접 입력하기"
              className="min-w-0 flex-1 truncate bg-transparent text-10 text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </div>

          {hasFreeText ? (
            <button
              type="button"
              onClick={submitFreeText}
              aria-label="직접 입력 보내기"
              className="flex h-6.25 w-6.25 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-text-primary text-background-default"
            >
              <ArrowRight size={14} strokeWidth={3} aria-hidden />
            </button>
          ) : (
            <Button
              variant="outline"
              radius="sm"
              size="sm"
              onClick={onSkip}
              appendClassName="shrink-0"
            >
              건너뛰기
            </Button>
          )}
        </div>
        <div className="h-px w-full bg-border-default" />
      </div>
    </QuestionCard>
  );
}
