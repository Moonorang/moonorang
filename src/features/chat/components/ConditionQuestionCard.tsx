'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';

import Button from '@/shared/ui/Button';
import QuestionCard from '@/shared/ui/QuestionCard';
import TextField from '@/shared/ui/TextField';

import { CONDITION_QUESTIONS } from '@/features/chat/data/conditionQuestions';
import type { ChatKeywords } from '@/features/chat/types';

interface ConditionQuestionCardProps {
  currentIndex: number;
  /** 선택지 하이라이트를 keywords 현재값에서 그대로 읽는다 - 별도 답변 상태를 안 둔다 */
  keywords: ChatKeywords;
  onSelect: (field: keyof ChatKeywords, value: number, summaryText: string) => void;
  /** CARD-011: 직접 입력은 구조화 파싱 없이 일반 채팅 메시지로 그대로 보낸다 */
  onFreeText: (text: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
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
}: ConditionQuestionCardProps) {
  // 1. 상태 및 훅
  const [freeText, setFreeText] = useState('');
  const question = CONDITION_QUESTIONS[currentIndex];
  const selectedValue = keywords[question.keywordField] ?? null;

  // 2. 이벤트 핸들러
  const handleSelect = (value: number) => {
    const option = question.options.find((item) => item.value === value);
    const summaryText = `${question.summaryLabel}: ${option?.label ?? value}`;

    onSelect(question.keywordField, value, summaryText);
  };

  const submitFreeText = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;

    onFreeText(trimmed);
    setFreeText('');
  };

  const handleFreeTextKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitFreeText();
    }
  };

  // 3. 렌더링
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
    >
      {/* 기타(직접 입력) - CARD-011 */}
      <div className="flex items-center gap-2 pt-1">
        <TextField
          size="sm"
          value={freeText}
          onChange={(event) => setFreeText(event.target.value)}
          onKeyDown={handleFreeTextKeyDown}
          placeholder="선택지에 없으면 직접 입력해주세요"
        />
        <Button variant="outline" radius="sm" size="sm" onClick={submitFreeText}>
          입력
        </Button>
      </div>
    </QuestionCard>
  );
}
