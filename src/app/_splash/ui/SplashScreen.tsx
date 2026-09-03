'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import Button from '@/shared/ui/Button';

import { cn } from '@/shared/utils/cn';

const SPLASH_DURATION_MS = 2000;
const FADE_OUT_MS = 300;
const SPLASH_SEEN_STORAGE_KEY = 'moonorang:splash:seen';

type SplashPhase = 'checking' | 'visible' | 'leaving' | 'hidden';

export default function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('checking');

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

  const handleSkip = () => setPhase('leaving');

  if (phase === 'checking' || phase === 'hidden') return null;

  return (
    <div
      role="presentation"
      className={cn(
        'fixed inset-0 z-(--z-splash) bg-background-default transition-opacity ease-out',
        phase === 'leaving'
          ? 'opacity-0 duration-300'
          : 'opacity-100 duration-0',
      )}
    >
      <Image
        src="/images/splash.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* 건너뛰기 버튼 */}
      <Button
        variant="main"
        radius="full"
        size="xl"
        onClick={handleSkip}
        appendClassName="absolute right-4 bottom-8"
      >
        건너뛰기
      </Button>
    </div>
  );
}
