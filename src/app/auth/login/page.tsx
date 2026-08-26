'use client';

import { useState } from 'react';
import Image from 'next/image';

import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  // 1. 상태 및 훅
  const { signInWithKakao } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. 이벤트 핸들러
  const handleKakaoLoginClick = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await signInWithKakao();
    } catch {
      console.error(
        '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
    }
  };

  // 3. 렌더링
  return (
    <div className="mx-auto flex min-h-full max-w-(--width-container) flex-col items-center px-4 pt-(--height-header)">
      <h1 className="mt-16 text-32 font-bold text-text-main">로그인</h1>

      <button
        type="button"
        onClick={handleKakaoLoginClick}
        disabled={isSubmitting}
        aria-label="카카오로 로그인"
        className="mt-8 w-full hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Image
          src="/images/kakao_login.png"
          alt="카카오 로그인"
          width={600}
          height={90}
          className="h-auto w-full"
          priority
        />
      </button>
    </div>
  );
}
