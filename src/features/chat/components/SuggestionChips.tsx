import Button from '@/shared/ui/Button';
const MESSAGE_SUGGESTIONS = ['요금제 추천해줘', '나에게 맞춰 요금제 추천'];

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
          onClick={() => onSuggest(suggestion)}
          appendClassName="shrink-0"
        >
          {suggestion}
        </Button>
      ))}
      <Button
        variant="answer"
        radius="full"
        onClick={onPlanTest}
        appendClassName="shrink-0"
      >
        요금제 성향 검사해줘
      </Button>
    </div>
  );
}
