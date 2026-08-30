import { cn } from '@/shared/utils/cn';

interface CarouselIndicatorProps {
  total: number;
  activeIndex: number;
  className?: string;
}

export default function CarouselIndicator({
  total,
  activeIndex,
  className,
}: CarouselIndicatorProps) {
  if (total <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="카드 목록 위치"
      className={cn(
        'flex w-fit items-center justify-center gap-1.5 rounded-full bg-text-primary/50 px-3 py-1',
        className,
      )}
    >
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <span
            key={index}
            role="tab"
            aria-selected={isActive}
            aria-label={`${index + 1}번째 카드`}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-300',
              isActive ? 'bg-background-default' : 'bg-border-default',
            )}
          />
        );
      })}
    </div>
  );
}
