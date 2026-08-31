'use client';

import Image from 'next/image';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

interface PlusMenuProps {
  isOpen: boolean;
  onClose?: () => void;
  onReset?: () => void;
  onPlanTest?: () => void;
  appendClassName?: string;
}

export default function PlusMenu({
  isOpen,
  onClose,
  onReset,
  onPlanTest,
  appendClassName,
}: PlusMenuProps) {
  if (!isOpen) return null;

  const handleResetClick = () => {
    onReset?.();
    onClose?.();
  };

  const handlePlanTestClick = () => {
    onPlanTest?.();
    onClose?.();
  };

  return (
    <>
      {/* 팝업 외부 클릭 시 닫히도록 하는 투명 배경 */}
      <div
        className="fixed inset-0 z-(--z-modal)"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute bottom-[70px] left-4 z-(--z-modal) flex w-50 flex-col gap-2 rounded-md bg-background-default p-3 shadow-default',
          appendClassName,
        )}
      >
        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isFullWidth
          gap="md"
          onClick={handleResetClick}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-action-secondary-light text-action-secondary">
            <Image
              src="/images/chat/icon-reset.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-12 font-medium text-text-primary">
            대화 초기화
          </span>
        </Button>

        <div className="mx-2 h-px bg-border-light" />

        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isFullWidth
          gap="md"
          onClick={handlePlanTestClick}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent-2-light text-accent-2">
            <Image
              src="/images/chat/icon-plan-test.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-12 font-medium text-text-primary">
            요금제 성향 검사
          </span>
        </Button>

        <div className="h-px w-full bg-border-light" />

        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isFullWidth
          gap="md"
          onClick={onClose}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-action-primary-light text-action-primary">
            <Image
              src="/images/chat/icon-pdf-export.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-12 font-medium text-text-primary">
            상담 결과 PDF 출력
          </span>
        </Button>
      </div>
    </>
  );
}
