import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

/**
 * 대화 영역을 최하단으로 되돌리는 버튼.
 * 배치(위치 고정)는 감싸는 요소가 맡는다.
 */
export default function ScrollToBottomButton({
  onClick,
}: ScrollToBottomButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="맨 아래로 이동"
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-default bg-background-default text-text-secondary shadow-default transition-colors hover:text-text-primary"
    >
      <ChevronDown size={20} aria-hidden />
    </button>
  );
}
