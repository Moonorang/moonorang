'use client';

import { useState } from 'react';

import { CONDITION_QUESTIONS } from '@/features/chat/data/conditionQuestions';

/**
 * CARD-008~011: 채팅 안에 뜨는 조건 수집 카드의 문항 이동/열림 상태.
 * 답 자체(keywords)는 useChat이 갖고, 답변을 언제 하나로 모아 보낼지는 ChatRoom이
 * 정한다 - 이 훅은 "지금 몇 번째 문항이고, 마지막인지"만 다룬다.
 */
export function useConditionQuestions() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = () => {
    setIsOpen(true);
    setCurrentIndex(0);
  };

  const close = () => setIsOpen(false);

  // CARD-010: 문항 간 이동(화살표) - 마지막 문항에서도 카드를 닫지 않는다
  const goToPrev = () => setCurrentIndex((index) => Math.max(0, index - 1));
  const goToNext = () =>
    setCurrentIndex((index) =>
      Math.min(CONDITION_QUESTIONS.length - 1, index + 1),
    );

  return {
    isOpen,
    currentIndex,
    isLastQuestion: currentIndex === CONDITION_QUESTIONS.length - 1,
    open,
    close,
    goToPrev,
    goToNext,
  };
}
