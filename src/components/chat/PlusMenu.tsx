import { RefreshCcw, Sparkles, FileEdit } from 'lucide-react';
import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';

interface PlusMenuProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export default function PlusMenu({
  isOpen,
  onClose,
  className,
}: PlusMenuProps) {
  if (!isOpen) return null;

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
          'absolute bottom-[70px] left-4 z-(--z-modal) flex w-56 flex-col gap-1 rounded-xl bg-neutral-pure-white p-2 shadow-default',
          className,
        )}
      >
        <Button
          variant="ghost"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-neutral-off-white"
          onClick={onClose}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary-light-yellow text-primary-yellow">
            <RefreshCcw size={16} strokeWidth={2.5} />
          </div>
          <span className="text-14 font-bold text-text-main">대화 초기화</span>
        </Button>

        <div className="mx-2 h-px bg-border-light-gray" />

        <Button
          variant="ghost"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-neutral-off-white"
          onClick={onClose}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary-light-blue text-secondary-blue">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="text-14 font-bold text-text-main">
            요금제 성향 검사
          </span>
        </Button>

        <div className="mx-2 h-px bg-border-light-gray" />

        <Button
          variant="ghost"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-neutral-off-white"
          onClick={onClose}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary-light-red text-primary-red">
            <FileEdit size={16} strokeWidth={2.5} />
          </div>
          <span className="text-14 font-bold text-text-main">
            상담 결과 PDF 출력
          </span>
        </Button>
      </div>
    </>
  );
}
