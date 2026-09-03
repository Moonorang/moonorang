'use client';

import { useEffect, useId } from 'react';

import Button from '@/shared/ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  /** 무엇을 되묻는지 - 한 문장 질문으로 쓴다 */
  title: string;
  /** 확인을 누르면 무슨 일이 일어나는지. 되돌릴 수 없는 동작이면 반드시 적는다 */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 확인 처리가 비동기로 진행 중인지(COMMON-004 중복 제출 방지) - true면 두 버튼을
   * 다 막고, confirmingLabel이 있으면 확인 버튼 글자를 그걸로 바꾼다. */
  isConfirming?: boolean;
  confirmingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * 배경 클릭·Escape로도 취소할 수 있는지. 기본 true(대부분의 "정말요?" 확인창은
   * 취소가 안전한 기본 동작이라 이렇게 빠져나가도 된다). 취소도 하나의 결정이라
   * 실수로 배경을 눌러 조용히 취소돼선 안 되는 대화(예: 두 대화 중 하나를 반드시
   * 골라야 하는 경우)에서는 false로 꺼서, 버튼을 직접 눌러야만 닫히게 한다.
   */
  isDismissible?: boolean;
}

/**
 * 두 선택지 중 하나를 고르는 모달의 공통 뼈대.
 * - "정말 되돌릴 수 없는 동작을 하시겠어요?" 류의 확인창(CHAT-014 대화 초기화 등)
 * - 화면을 벗어나기 전에 한 번 더 묻는 이탈 확인(AUTH-004)
 * - 서로 다른 두 상태 중 하나를 사용자가 직접 고르게 하는 강제 선택(로그인 시
 *   회원/게스트 대화 충돌 등)
 * 세 경우 모두 마크업이 사실상 같아서(배경 딤 + 카드 + 버튼 2개) 여기 하나로 모으고,
 * 문구나 강제 선택 여부처럼 경우마다 다른 부분만 props로 받는다. 도메인에 특화된
 * 문구·자기만의 이름이 필요한 곳(ExitSignupDialog, ChatConflictModal)은 이 컴포넌트를
 * 감싸는 얇은 래퍼로 남겨서, 그 호출부는 이 리팩터링과 무관하게 그대로 둔다.
 *
 * 떠 있는 동안 배경 스크롤을 막는다(COMMON-005).
 */
export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  isConfirming = false,
  confirmingLabel,
  onConfirm,
  onCancel,
  isDismissible = true,
}: ConfirmModalProps) {
  // 1. 상태 및 훅
  const titleId = useId();

  // 2. 부수 효과
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    if (!isDismissible) {
      return () => {
        document.body.style.overflow = overflow;
      };
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDismissible, onCancel]);

  // 3. 렌더링
  if (!isOpen) return null;

  return (
    <div
      role={isDismissible ? 'dialog' : 'alertdialog'}
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center px-4"
    >
      {/* 딤 배경. 강제 선택이면 버튼이 아니라 그냥 div라 클릭해도 안 닫힌다. */}
      {isDismissible ? (
        <button
          type="button"
          aria-label={`${title} 닫기`}
          onClick={onCancel}
          className="absolute inset-0 h-full w-full cursor-pointer bg-text-primary/50"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 h-full w-full bg-text-primary/50"
        />
      )}

      <div className="relative flex w-full max-w-(--width-container) min-w-(--width-container-min) flex-col gap-4 rounded-md bg-background-default p-4">
        <div className="flex flex-col gap-1">
          <p
            id={titleId}
            className="text-14 font-semibold whitespace-pre-line text-text-primary"
          >
            {title}
          </p>

          {description && (
            <p className="text-12 leading-fixed whitespace-pre-line text-text-secondary">
              {description}
            </p>
          )}
        </div>

        <div className="mt-2 flex gap-1">
          <Button
            type="button"
            variant="outline"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="main"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming && confirmingLabel ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
