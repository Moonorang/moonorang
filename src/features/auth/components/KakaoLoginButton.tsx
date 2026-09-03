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
  /**
   * 'full'  - 주어진 폭을 다 쓴다. 로그인 화면처럼 이것이 그 화면의 주된 행동일 때.
   * 'compact' - 폭에 상한을 두고 가운데 세운다. 대화 속 카드처럼 다른 내용 사이에
   *   끼어 있을 때 - 버튼 그림이 가로로 긴 비율(600x90)이라 폭을 다 쓰면 넓은
   *   화면에서 세로로도 같이 커져 카드를 뒤덮는다.
   */
  size?: 'full' | 'compact';
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
  size = 'full',
}: KakaoLoginButtonProps) {
  // 1. 상태 및 훅
  const isCompact = size === 'compact';
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
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleKakaoLoginClick}
        disabled={isSubmitting}
        aria-label="카카오로 로그인"
        className={cn(
          'w-full max-w-100 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
          isCompact && 'max-w-64 self-center',
        )}
      >
        <Image
          src="/images/kakao_login.png"
          alt="카카오 로그인"
          width={600}
          height={90}
          className="h-auto w-full"
          priority={!isCompact}
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
