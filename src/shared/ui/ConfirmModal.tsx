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
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 되돌릴 수 없는 동작 앞에서 한 번 되묻는 모달.
 *
 * 배경 클릭과 Escape 로도 닫히고(AUTH-002 와 같은 취지), 떠 있는 동안 배경
 * 스크롤을 막는다(COMMON-005). 닫는 길이 여럿이라 그중 무엇도 실행으로 이어지지
 * 않게, 확인은 오직 확인 버튼으로만 한다.
 */
export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // 1. 상태 및 훅
  const titleId = useId();

  // 2. 부수 효과
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onCancel]);

  // 3. 렌더링
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center px-4">
      {/* 딤 배경. 버튼이라 클릭·키보드 어느 쪽으로도 닫힌다 */}
      <button
        type="button"
        aria-label={`${title} 닫기`}
        onClick={onCancel}
        className="absolute inset-0 h-full w-full cursor-pointer bg-text-primary/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-(--width-container) flex-col rounded-md bg-background-default p-4"
      >
        <p id={titleId} className="text-14 font-medium text-text-primary">
          {title}
        </p>

        {description && (
          <p className="mt-2 text-12 leading-fixed text-text-secondary">
            {description}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onCancel}
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
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
