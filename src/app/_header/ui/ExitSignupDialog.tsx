'use client';

import { useEffect } from 'react';

import Button from '@/shared/ui/Button';

interface ExitSignupDialogProps {
  /** 그만두기 처리 중 - 중복 제출을 막는다(COMMON-004) */
  isExiting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 추가 정보 입력을 마치기 전에 나가려 할 때 뜨는 확인 창.
 * 여기서 나가면 인증 세션까지 정리되므로, 그 결과를 먼저 알리고 확인을 받는다(AUTH-004).
 */
export default function ExitSignupDialog({
  isExiting,
  onCancel,
  onConfirm,
}: ExitSignupDialogProps) {
  // COMMON-005: 모달이 떠 있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="exit-signup-title"
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-text-primary/50 px-4"
    >
      <div className="flex w-full max-w-(--width-container) flex-col gap-4 rounded-md bg-background-default p-4">
        <div className="flex flex-col gap-1">
          <h2
            id="exit-signup-title"
            className="text-14 font-bold text-text-primary"
          >
            가입을 그만두시겠어요?
          </h2>
          <p className="text-12 text-text-secondary">
            지금 나가면 로그아웃되고, 입력하신 내용은 저장되지 않아요. 다시
            이용하시려면 카카오 로그인부터 진행해 주세요.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onCancel}
            disabled={isExiting}
          >
            이어서 할게요
          </Button>
          <Button
            variant="main"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onConfirm}
            disabled={isExiting}
          >
            {isExiting ? '나가는 중...' : '그만둘래요'}
          </Button>
        </div>
      </div>
    </div>
  );
}
