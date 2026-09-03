import { create } from 'zustand';

import { TUTORIAL_STEPS } from '../config/steps';

const TUTORIAL_SEEN_STORAGE_KEY = 'moonorang:tutorial:seen';

/** TUTORIAL-004: 완료 또는 건너뛰기 여부 저장 - 재방문 시 다시 표시하지 않기 위함 */
export function hasSeenTutorial(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_SEEN_STORAGE_KEY) === 'true';
  } catch {
    // localStorage를 못 쓰는 환경(프라이빗 모드 등) - 매번 보여주는 쪽이 안전하다
    return false;
  }
}

function markTutorialSeen() {
  try {
    window.localStorage.setItem(TUTORIAL_SEEN_STORAGE_KEY, 'true');
  } catch {
    // 저장 실패해도 이번 열람에는 지장 없다 - 다음 방문에 또 뜰 뿐이다
  }
}

interface TutorialState {
  isOpen: boolean;
  stepIndex: number;

  /** TUTORIAL-005: 다시 보기 - 처음부터 다시 연다 */
  open: () => void;
  /** TUTORIAL-002: 문항 간 이동 */
  goToNext: () => void;
  goToPrev: () => void;
  /**
   * TUTORIAL-003/004: 건너뛰기와 완료 모두 "이번 튜토리얼을 끝냄"이라는 결론은
   * 같다 - 사용자 입장에서 둘 다 다시 보여줄 필요가 없는 상태라, 저장까지 같이 한다.
   */
  finish: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isOpen: false,
  stepIndex: 0,

  open: () => set({ isOpen: true, stepIndex: 0 }),

  goToNext: () =>
    set((state) => ({
      stepIndex: Math.min(TUTORIAL_STEPS.length - 1, state.stepIndex + 1),
    })),

  goToPrev: () =>
    set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),

  finish: () => {
    markTutorialSeen();
    set({ isOpen: false });
  },
}));
