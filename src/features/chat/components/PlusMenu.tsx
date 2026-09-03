'use client';

import Image from 'next/image';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

interface PlusMenuProps {
  isOpen: boolean;
  onClose?: () => void;
  onReset?: () => void;
  onPlanTest?: () => void;
  /** CARD-013/015: 대화에서 파악한 관심사를 보고 고칠 수 있는 화면을 연다 */
  onInterests?: () => void;
  appendClassName?: string;
}

export default function PlusMenu({
  isOpen,
  onClose,
  onReset,
  onPlanTest,
  onInterests,
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

  const handleInterestsClick = () => {
    onInterests?.();
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
          appendClassName="justify-start"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-action-secondary-light text-action-secondary">
            <Image
              src="/images/chat/icon-reset.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-left text-12 font-medium text-text-primary">
            대화 초기화
          </span>
        </Button>

        <div className="h-px w-full bg-border-light" />

        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isFullWidth
          gap="md"
          onClick={handlePlanTestClick}
          appendClassName="justify-start"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent-2-light text-accent-2">
            <Image
              src="/images/chat/icon-plan-test.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-left text-12 font-medium text-text-primary">
            취미 성향 검사
          </span>
        </Button>

        <div className="h-px w-full bg-border-light" />

        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isFullWidth
          gap="md"
          onClick={handleInterestsClick}
          appendClassName="justify-start"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-action-primary-light text-action-primary">
            <Image
              src="/images/chat/icon-pdf-export.png"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <span className="text-left text-12 font-medium text-text-primary">
            나의 관심사 알아보기
          </span>
        </Button>
      </div>
    </>
  );
}
