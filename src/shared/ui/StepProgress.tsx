import { cn } from '@/shared/utils/cn';

interface StepProgressProps {
  /** 전체 단계 수 */
  total: number;
  /** 현재 단계 (0부터) */
  currentIndex: number;
  /** 보조기술이 읽을 진행 표시줄 이름 */
  ariaLabel: string;
}

/**
 * 단계를 칸으로 늘어놓고 지나온 칸을 채우는 진행 표시줄.
 * 단계의 이름이나 개수는 모르고 숫자만 받는다.
 */
export default function StepProgress({
  total,
  currentIndex,
  ariaLabel,
}: StepProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={currentIndex + 1}
      aria-valuetext={`${total}단계 중 ${currentIndex + 1}단계`}
      className="flex gap-1"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-1 flex-1',
            index <= currentIndex ? 'bg-action-secondary' : 'bg-border-default',
          )}
        />
      ))}
    </div>
  );
}
