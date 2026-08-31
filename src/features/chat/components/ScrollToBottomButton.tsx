import { ChevronDown } from 'lucide-react';

import Button from '@/shared/ui/Button';

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
    <Button
      variant="outline"
      radius="full"
      size="none"
      onClick={onClick}
      aria-label="맨 아래로 이동"
      // h-10 w-10 은 카탈로그(not-found.tsx)의 아이콘 버튼 관용구를 따른 것.
      // shadow-default 는 Button 에 실을 prop 이 없어 임시로 얹는다 - isIconOnly 가 생기면 걷어낸다
      appendClassName="h-10 w-10 shadow-default"
    >
      <ChevronDown size={20} aria-hidden />
    </Button>
  );
}
