import { ChevronDown, Lightbulb } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface ExpandToggleProps {
  summary: string;
  isExpanded: boolean;
  onToggle: () => void;
}

// 카드 하단의 펼침 버튼 (혜택 요약 + 화살표)
export default function ExpandToggle({
  summary,
  isExpanded,
  onToggle,
}: ExpandToggleProps) {
  return (
    <>
      <hr className="mx-4 border-border-default" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 pt-2 pb-5 text-left"
      >
        {/* text-action-secondary - 색상 변경 팔요 */}
        <span className="flex min-w-0 items-center gap-1.5 text-10 font-medium text-action-secondary">
          <Lightbulb
            size={14}
            className="shrink-0 text-action-secondary"
            aria-hidden
          />
          <span className="truncate">{summary}</span>
        </span>
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-border-light">
          <ChevronDown
            size={12}
            aria-hidden

            className={cn(
              'text-text-primary transition-transform',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </button>
    </>
  );
}
