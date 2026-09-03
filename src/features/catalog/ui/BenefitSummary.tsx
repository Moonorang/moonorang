import { Lightbulb } from 'lucide-react';

interface BenefitSummaryProps {
  summary: string;
}

// 카드 하단에 한 줄로 붙는 혜택 요약
export default function BenefitSummary({ summary }: BenefitSummaryProps) {
  return (
    <>
      <hr className="mx-4 border-border-default" />
      <div className="flex w-full items-center justify-between gap-2 px-4 pt-2 pb-5 text-left">
        {/* text-action-secondary - 색상 변경 필요 */}
        <span className="flex min-w-0 items-center gap-1.5 text-10 font-medium text-action-secondary">
          <Lightbulb
            size={14}
            className="shrink-0 text-action-secondary"
            aria-hidden
          />
          <span className="truncate">{summary}</span>
        </span>
      </div>
    </>
  );
}
