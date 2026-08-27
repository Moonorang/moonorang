import { Wifi, CircleDollarSign } from 'lucide-react';

import Button from '@/components/common/Button';

interface SuggestionChipsProps {
  onSuggest: (text: string) => void;
}

export default function SuggestionChips({ onSuggest }: SuggestionChipsProps) {
  return (
    <div className="no-scrollbar flex w-full justify-center gap-1 overflow-x-auto px-4 pb-4">
      <Button
        variant="answer"
        radius="full"
        onClick={() => onSuggest('요금제 추천해주세요')}
        className="flex shrink-0 items-center gap-1 px-3 py-2 shadow-default"
      >
        <Wifi size={12} aria-hidden />
        요금제 추천해주세요
      </Button>
      <Button
        variant="answer"
        radius="full"
        onClick={() => onSuggest('내 요금제 절약해주세요')}
        className="flex shrink-0 items-center gap-1 px-3 py-2 shadow-default"
      >
        <CircleDollarSign size={12} aria-hidden />내 요금제 절약해주세요
      </Button>
    </div>
  );
}
