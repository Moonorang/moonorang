'use client';

import { useEffect, useRef } from 'react';

import { useSplashStore } from '@/app/_splash';

import { hasSeenTutorial, useTutorialStore } from './tutorialStore';

/**
 * TUTORIAL-001: 스플래시가 끝나는 시점을 기다렸다가, 처음 온 사람이면 튜토리얼을 연다.
 * 스플래시가 실제로 재생됐든(첫 방문), 이미 본 적 있어서 안 떴든 - isDone 하나로
 * 통일해서 판단한다(SplashScreen 쪽과 같은 이유).
 */
export function useTutorialGate() {
  const isSplashDone = useSplashStore((state) => state.isDone);
  const open = useTutorialStore((state) => state.open);

  // 이 세션에서 한 번만 판단한다 - isSplashDone은 그 이후로도 계속 true라
  // 가드가 없으면 매 렌더마다 다시 열릴 조건을 검사하게 된다.
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!isSplashDone || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!hasSeenTutorial()) open();
  }, [isSplashDone, open]);
}
