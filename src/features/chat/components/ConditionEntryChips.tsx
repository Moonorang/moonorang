import { MessageSquareText, ListChecks } from 'lucide-react';

import Button from '@/shared/ui/Button';

interface ConditionEntryChipsProps {
  /** "텍스트로 답할게요" - 그냥 이 칩을 닫고 평소처럼 채팅으로 이어간다 */
  onChooseText: () => void;
  /** "선택지로 답할게요" - 조건 수집 카드를 연다 */
  onChooseCard: () => void;
}

/**
 * AI가 조건(예산·데이터 사용량)을 막 물어본 시점에 뜨는 칩.
 * 텍스트로 계속 대화할지, 선택형 카드로 답할지 사용자가 고른다.
 */
export default function ConditionEntryChips({
  onChooseText,
  onChooseCard,
}: ConditionEntryChipsProps) {
  return (
    <div className="no-scrollbar flex w-full justify-center gap-1 overflow-x-auto px-4 pb-4">
      <Button
        variant="answer"
        radius="full"
        onClick={onChooseText}
        gap="sm"
        appendClassName="shrink-0"
      >
        <MessageSquareText size={12} aria-hidden />
        텍스트로 답할게요
      </Button>
      <Button
        variant="answer"
        radius="full"
        onClick={onChooseCard}
        gap="sm"
        appendClassName="shrink-0"
      >
        <ListChecks size={12} aria-hidden />
        선택지로 답할게요
      </Button>
    </div>
  );
}
