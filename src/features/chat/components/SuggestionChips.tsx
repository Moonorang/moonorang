import Button from '@/shared/ui/Button';

import { MESSAGE_SUGGESTIONS } from '@/features/chat/constants';

interface SuggestionChipsProps {
  onSuggest: (text: string) => void;
  onPlanTest?: () => void;
}

export default function SuggestionChips({
  onSuggest,
  onPlanTest,
}: SuggestionChipsProps) {
  return (
    <div className="no-scrollbar flex w-full justify-start gap-1 overflow-x-auto px-4 pb-4">
      {MESSAGE_SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          variant="answer"
          radius="full"
          size="lg"
          onClick={() => onSuggest(suggestion)}
          appendClassName="shrink-0"
        >
          {suggestion}
        </Button>
      ))}
      <Button
        variant="answer"
        radius="full"
        size="lg"
        onClick={onPlanTest}
        appendClassName="shrink-0"
      >
        요금제 성향 검사해줘
      </Button>
    </div>
  );
}
