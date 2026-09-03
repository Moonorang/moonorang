'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TEST_QUESTIONS } from '@/features/test/data/questions';
import { useTestStore } from '@/features/test/store/testStore';

// 결과 화면으로 넘어가기 전 로딩 모달을 보여주는 시간
const RESULT_LOADING_MS = 1200;

/**
 * 채팅 안에서 진행하는 취미 성향 검사 흐름 (TEST-001~005).
 * 문항 이동·응답·마지막 문항 이후 결과 화면 전환까지를 한곳에서 다룬다.
 */
export function useTestFlow() {
  const router = useRouter();
  const {
    isTestOpen,
    answers,
    currentIndex,
    openTest,
    closeTest,
    goToPrev,
    goToNext,
    selectOption,
  } = useTestStore();

  const [isResultLoading, setIsResultLoading] = useState(false);

  // 로딩 모달을 잠깐 보여준 뒤 결과 화면으로 넘어간다
  useEffect(() => {
    if (!isResultLoading) return;

    const timer = setTimeout(
      () => router.push('/test/result'),
      RESULT_LOADING_MS,
    );

    return () => clearTimeout(timer);
  }, [isResultLoading, router]);

  // 마지막 문항까지 답하거나 건너뛰면 결과 화면으로 넘어간다
  const goToNextOrResult = () => {
    if (currentIndex === TEST_QUESTIONS.length - 1) {
      closeTest();
      setIsResultLoading(true);
      return;
    }

    goToNext();
  };

  const selectAndAdvance = (value: number) => {
    selectOption(value);
    goToNextOrResult();
  };

  return {
    isTestOpen,
    isResultLoading,
    currentIndex,
    selectedValue: answers[currentIndex],
    openTest,
    closeTest,
    goToPrev,
    goToNext,
    selectAndAdvance,
    skipQuestion: goToNextOrResult,
  };
}
