import { create } from 'zustand';

import { TEST_QUESTIONS } from '@/data/testQuestions';

const EMPTY_ANSWERS: (number | null)[] = TEST_QUESTIONS.map(() => null);

interface TestState {
  // 카드가 채팅에 떠 있는지 (CHAT-015 진입 / CARD-011 닫기)
  isTestOpen: boolean;
  // 문항별로 고른 선택지의 score, 건너뛰면 null 로 남는다
  answers: (number | null)[];
  currentIndex: number;

  openTest: () => void;
  closeTest: () => void;
  // CARD-010: 문항 간 이동
  goToPrev: () => void;
  goToNext: () => void;
  selectOption: (score: number) => void;
  resetTest: () => void;
}

export const useTestStore = create<TestState>((set) => ({
  isTestOpen: false,
  answers: EMPTY_ANSWERS,
  currentIndex: 0,

  openTest: () =>
    set({ isTestOpen: true, answers: EMPTY_ANSWERS, currentIndex: 0 }),

  closeTest: () => set({ isTestOpen: false }),

  goToPrev: () =>
    set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) })),

  goToNext: () =>
    set((state) => ({
      currentIndex: Math.min(TEST_QUESTIONS.length - 1, state.currentIndex + 1),
    })),

  selectOption: (score) =>
    set((state) => {
      const answers = [...state.answers];
      answers[state.currentIndex] = score;
      return { answers };
    }),

  resetTest: () =>
    set({ isTestOpen: false, answers: EMPTY_ANSWERS, currentIndex: 0 }),
}));
