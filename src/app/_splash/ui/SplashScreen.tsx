'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import Button from '@/shared/ui/Button';

import { useSplashStore } from '../model/splashStore';

import { cn } from '@/shared/utils/cn';

const SPLASH_DURATION_MS = 2000;
const FADE_OUT_MS = 300;
const SPLASH_SEEN_STORAGE_KEY = 'moonorang:splash:seen';

type SplashPhase = 'checking' | 'visible' | 'leaving' | 'hidden';

export default function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('checking');
  const markDone = useSplashStore((state) => state.markDone);

  const hasCheckedRef = useRef(false);

  // 마운트 직후 딱 한 번 본 적 있는지 확인
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    let hasSeenBefore = false;
    try {
      hasSeenBefore =
        window.localStorage.getItem(SPLASH_SEEN_STORAGE_KEY) === 'true';
    } catch {
      // localStorage를 못 쓰는 환경(프라이빗 모드 등) - 매번 보여주는 쪽이 안전하다
    }

    if (hasSeenBefore) {
      setPhase('hidden');
      return;
    }

    setPhase('visible');
    try {
      window.localStorage.setItem(SPLASH_SEEN_STORAGE_KEY, 'true');
    } catch {
      // 저장 실패해도 이번 방문에서 보여주는 데는 지장 없다 - 다음에 또 보일 뿐이다
    }
  }, []);

  useEffect(() => {
    if (phase === 'checking' || phase === 'hidden') return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'visible') return;

    const timer = setTimeout(() => setPhase('leaving'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leaving') return;

    const timer = setTimeout(() => setPhase('hidden'), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // 스플래시가 화면에서 사라지는 모든 경로(이전에 본 적 있어서 아예 안 뜬 경우,
  // 건너뛰기, 재생 완료)를 여기 한 곳에서만 감지해 튜토리얼에 신호를 보낸다.
  useEffect(() => {
    if (phase !== 'hidden') return;

    markDone();
  }, [phase, markDone]);

  const handleSkip = () => setPhase('leaving');

  if (phase === 'checking' || phase === 'hidden') return null;

  return (
    <div
      role="presentation"
      className={cn(
        // COMMON-006: 다른 화면과 같은 규칙 - 최대 너비 컬럼 바깥은 검은색
        'fixed inset-0 z-(--z-splash) bg-background-page transition-opacity ease-out',
        phase === 'leaving'
          ? 'opacity-0 duration-300'
          : 'opacity-100 duration-0',
      )}
    >
      <div className="mx-auto flex h-full max-w-(--width-container) min-w-(--width-container-min) items-center justify-center bg-[#FDF3CB]">
        <Image
          src="/images/splash.png"
          alt=""
          width={853}
          height={1844}
          priority
          sizes="100vw"
          className="h-full w-auto object-contain"
        />
      </div>

      {/* 건너뛰기 버튼 */}
      <Button
        variant="main"
        radius="sm"
        size="xl"
        onClick={handleSkip}
        appendClassName="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        건너뛰기
      </Button>
    </div>
  );
}
