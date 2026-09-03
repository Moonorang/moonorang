import Button from '@/shared/ui/Button';

import { useDragScroll } from '@/shared/hooks/useDragScroll';

import { MESSAGE_SUGGESTIONS } from '@/features/chat/constants';

interface SuggestionChipsProps {
  onSuggest: (text: string) => void;
  onPlanTest?: () => void;
}

export default function SuggestionChips({
  onSuggest,
  onPlanTest,
}: SuggestionChipsProps) {
  // 터치·트랙패드는 브라우저가 기본으로 스크롤해주지만, 마우스 드래그는 그렇지
  // 않아서 직접 붙여준다
  const dragScroll = useDragScroll<HTMLDivElement>();

  return (
    <div
      {...dragScroll}
      className="no-scrollbar flex w-full cursor-grab justify-start gap-1 overflow-x-auto px-4 pb-4 active:cursor-grabbing"
    >
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
