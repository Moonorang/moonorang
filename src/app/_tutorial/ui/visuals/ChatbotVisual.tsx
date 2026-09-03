import Image from 'next/image';

import Button from '@/shared/ui/Button';

import { MESSAGE_SUGGESTIONS } from '@/features/chat/constants';

// 실제 칩은 6개+성향검사까지 있어 한 줄에 다 담기엔 많다 - 튜토리얼에서는
// 대표로 앞 3개만 미리 보여준다
const PREVIEW_SUGGESTIONS = MESSAGE_SUGGESTIONS.slice(0, 3);

/** 네 번째 단계 - 무너가 말풍선으로 할 수 있는 일을, 실제 추천 질문 칩 그대로 보여준다 */
export default function ChatbotVisual() {
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="flex w-full items-start gap-3 px-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-action-secondary-light p-1">
          <Image
            src="/images/chat/ai-avatar.png"
            alt="무너"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </span>

        <div className="rounded-xl rounded-tl-none bg-background-default px-4 py-3 shadow-default">
          <p className="text-14 leading-fixed text-text-primary">
            데이터는 얼마나 쓰시고, 한 달 예산은 어느 정도로 생각하세요?
          </p>
        </div>
      </div>

      {/* CHAT-003: 실제 입력창 위 추천 질문 칩과 같은 내용·같은 스타일 -
          미리보기라 누를 순 없다 */}
      <div
        className="no-scrollbar flex w-full justify-start gap-1 overflow-x-auto px-2"
        aria-hidden
      >
        {PREVIEW_SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            variant="answer"
            radius="full"
            size="md"
            tabIndex={-1}
            appendClassName="pointer-events-none shrink-0"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
