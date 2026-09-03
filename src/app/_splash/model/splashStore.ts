import { create } from 'zustand';

interface SplashState {
  // 스플래시가 화면에서 완전히 사라졌는지 (건너뛰기로 끝났든, 재생을 다 마쳤든,
  // 이전에 본 적 있어서 아예 뜨지 않았든 전부 포함) - 튜토리얼이 이 시점을
  // 기다렸다가 이어서 뜬다(TUTORIAL-001).
  isDone: boolean;
  markDone: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  isDone: false,
  markDone: () => set({ isDone: true }),
}));
