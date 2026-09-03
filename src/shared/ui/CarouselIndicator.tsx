import { cn } from '@/shared/utils/cn';

interface CarouselIndicatorProps {
  total: number;
  activeIndex: number;
  /** 점을 눌러 해당 순번으로 바로 이동할 때 쓴다. 없으면 그냥 현재 위치 표시만 한다 */
  onSelect?: (index: number) => void;
  appendClassName?: string;
}

export default function CarouselIndicator({
  total,
  activeIndex,
  onSelect,
  appendClassName,
}: CarouselIndicatorProps) {
  if (total <= 1) return null;

  return (
    <div
      role="tablist"
      className={cn(
        'flex w-fit items-center justify-center gap-1.5 rounded-full bg-text-primary/20 px-2 py-1.5',
        appendClassName,
      )}
    >
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${index + 1}번째 카드로 이동`}
            onClick={() => onSelect?.(index)}
            className={cn(
              'h-2 w-2 cursor-pointer rounded-full transition-all duration-300',
              isActive ? 'w-5 bg-action-primary' : 'bg-background-default',
            )}
          />
        );
      })}
    </div>
  );
}
