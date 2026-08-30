'use client';

import { useState } from 'react';
import Image from 'next/image';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getLoginErrorMessage } from '@/features/auth/lib/loginErrorMessage';
import { cn } from '@/shared/utils/cn';

interface KakaoLoginButtonProps {
  /** AUTH-014: 로그인 후 돌아갈 경로 */
  nextPath?: string;
  /** 콜백이 실패해 되돌아왔을 때 URL 에 붙어 오는 사유 코드 */
  errorCode?: string;
  appendClassName?: string;
}

/**
 * AUTH-003: 카카오 간편 로그인 진입점.
 * 로그인 페이지와 로그인 모달(AUTH-001) 양쪽에서 그대로 쓰기 위해 분리했다.
 * 실패 안내(AUTH-004)도 여기서 처리한다 - 콜백에서 넘어온 사유와
 * 호출 자체가 실패한 경우를 한 자리에 모아 보여준다.
 */
export default function KakaoLoginButton({
  nextPath,
  errorCode,
  appendClassName,
}: KakaoLoginButtonProps) {
  // 1. 상태 및 훅
  const { signInWithKakao } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // 방금 시도한 실패가 있으면 그쪽이 우선, 없으면 콜백이 넘긴 사유
  const errorMessage = requestError ?? getLoginErrorMessage(errorCode);

  // 2. 이벤트 핸들러
  const handleKakaoLoginClick = async () => {
    // COMMON-004: 처리 중 중복 제출 차단
    if (isSubmitting) return;

    setIsSubmitting(true);
    setRequestError(null);

    try {
      await signInWithKakao(nextPath);
    } catch {
      setRequestError(
        '카카오 로그인을 시작하지 못했어요. 네트워크 상태를 확인하고 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
    }
  };

  // 3. 렌더링
  return (
    <div className={cn('flex w-full flex-col gap-3', appendClassName)}>
      <button
        type="button"
        onClick={handleKakaoLoginClick}
        disabled={isSubmitting}
        aria-label="카카오로 로그인"
        className="w-full hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md bg-action-primary-light px-4 py-3 text-center text-12 text-status-error"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
