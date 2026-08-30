'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import AiMessage from '@/features/chat/components/AiMessage';
import ChatErrorNotice from '@/features/chat/components/ChatErrorNotice';
import ChatInput from '@/features/chat/components/ChatInput';
import PlanCardCarousel from '@/features/chat/components/PlanCardCarousel';
import PlusMenu from '@/features/chat/components/PlusMenu';
import ScrollToBottomButton from '@/features/chat/components/ScrollToBottomButton';
import SuggestionChips from '@/features/chat/components/SuggestionChips';
import UserMessage from '@/features/chat/components/UserMessage';
import {
  WELCOME_CREATED_AT,
  WELCOME_MESSAGE,
} from '@/features/chat/constants';
import { useChat } from '@/features/chat/hooks/useChat';

/** 최하단에서 이 거리(px) 이내면 바닥에 있는 것으로 본다 */
const BOTTOM_THRESHOLD_PX = 24;

interface ChatRoomProps {
  /**
   * 대화 영역 하단에 끼워 넣을 카드 (성향 검사 문항 등).
   * 값이 있으면 떠 있는 것으로 보고 추천 질문 칩을 감춘다.
   */
  overlay?: ReactNode;
  /** CHAT-015: 추가 기능 메뉴의 '요금제 성향 검사' 진입 */
  onPlanTest?: () => void;
}

/** 채팅 화면 본체 - 대화 내역, 추천 질문 칩, 입력창, 추가 기능 메뉴 */
export default function ChatRoom({ overlay, onPlanTest }: ChatRoomProps) {
  // 1. 상태 및 훅
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  // 바닥에 있는지 여부 - 자동 스크롤 여부와 버튼 노출을 함께 결정한다
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { messages, isStreaming, error, sendMessage, retry, reset } = useChat();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const element = scrollAreaRef.current;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
  }, []);

  // 2. 부수 효과
  // 메시지가 추가되거나 답변 토큰이 쌓일 때마다 최하단으로 이동한다.
  // 토큰마다 호출되므로 smooth 대신 즉시 이동 - smooth는 매 토큰마다
  // 애니메이션이 새로 시작돼 화면이 덜컹거린다.
  // 단, 사용자가 위로 올려 이전 대화를 읽는 중이면 끌어내리지 않는다.
  useEffect(() => {
    if (!isAtBottom) return;

    scrollToBottom();
  }, [messages, error, isAtBottom, scrollToBottom]);

  // 3. 이벤트 핸들러
  const handleScroll = () => {
    const element = scrollAreaRef.current;
    if (!element) return;

    const distanceToBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setIsAtBottom(distanceToBottom <= BOTTOM_THRESHOLD_PX);
  };

  const handleSend = () => {
    const text = value;
    setValue('');
    // 위로 올려둔 상태에서 보내도 방금 보낸 메시지는 보이게 한다
    setIsAtBottom(true);
    sendMessage(text);
  };

  // CHAT-003: 칩을 선택하면 입력창에 채우는 데 그치지 않고 바로 전송한다.
  const handleSuggest = (text: string) => {
    sendMessage(text);
  };

  const lastMessageId = messages[messages.length - 1]?.id;

  // 4. 렌더링
  return (
    <div className="flex h-dvh flex-col bg-background-subtle">
      {/* height-header, height-chat-input 만큼 여백을 준다 (메시지가 가려지지 않도록) */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto pt-(--height-header) pb-(--height-chat-input)"
      >
        {/* 채팅 내역 영역 */}
        <div className="flex flex-col gap-6 px-4 py-6">
          <AiMessage
            content={WELCOME_MESSAGE}
            createdAt={WELCOME_CREATED_AT}
          />

          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage
                key={message.id}
                content={message.content}
                createdAt={message.createdAt}
              />
            ) : (
              <AiMessage
                key={message.id}
                content={message.content}
                createdAt={message.createdAt}
                isStreaming={isStreaming && message.id === lastMessageId}
              >
                {message.recommendations &&
                  message.recommendations.length > 0 && (
                    <PlanCardCarousel
                      recommendations={message.recommendations}
                    />
                  )}
              </AiMessage>
            ),
          )}

          {error && <ChatErrorNotice reason={error.reason} onRetry={retry} />}
        </div>

        {/* 메시지 리스트 하단에 칩 버튼 배치 (입력창 위로 떠 있는 듯한 위치) */}
        {/* 최초 진입 시에만 노출하고, 사용자가 메시지를 보내거나 */}
        {/* 오버레이 카드가 떠 있는 동안에는 감춘다 */}
        {messages.length === 0 && !overlay && (
          <div className="mt-auto">
            <SuggestionChips onSuggest={handleSuggest} />
          </div>
        )}

        {/*
          대화가 짧아도 카드가 위로 밀려 올라가지 않도록 입력창 바로 위에 둔다.
          mt-auto 로 남는 공간을 흡수하고, sticky 로 스크롤해도 자리를 지킨다.
          scrollport 는 패딩 박스라 bottom-0 이면 고정된 입력창에 가린다 -
          입력창 높이만큼 띄운다.
        */}
        {overlay && (
          <div className="sticky bottom-(--height-chat-input) z-10 mt-auto px-4 pb-4">
            {overlay}
          </div>
        )}
      </div>

      {/*
        최하단 이동 버튼. 입력창 우측 전송 버튼 바로 위에 오도록
        입력창 높이만큼 띄우고(pb-2 로 8px 간격), 전송 버튼과 같은 px-4 기준에 맞춘다.
      */}
      {!isAtBottom && (
        <div className="fixed right-4 bottom-(--height-chat-input) z-(--z-chat-input) pb-2">
          <ScrollToBottomButton onClick={scrollToBottom} />
        </div>
      )}

      <PlusMenu
        isOpen={isPlusMenuOpen}
        onClose={() => setIsPlusMenuOpen(false)}
        onReset={reset}
        onPlanTest={onPlanTest}
      />

      <ChatInput
        value={value}
        onChange={setValue}
        onSend={handleSend}
        onPlusClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
        isPlusOpen={isPlusMenuOpen}
        disabled={isStreaming}
      />
    </div>
  );
}
