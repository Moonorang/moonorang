'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import PlanCard from '@/entities/plan/ui/PlanCard';

import AiMessage from '@/features/chat/components/AiMessage';
import ChatErrorNotice from '@/features/chat/components/ChatErrorNotice';
import ChatInput from '@/features/chat/components/ChatInput';
import PlusMenu from '@/features/chat/components/PlusMenu';
import SuggestionChips from '@/features/chat/components/SuggestionChips';
import UserMessage from '@/features/chat/components/UserMessage';
import { WELCOME_CREATED_AT, WELCOME_MESSAGE } from '@/features/chat/constants';
import { useChat } from '@/features/chat/hooks/useChat';

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
  useEffect(() => {
    scrollToBottom();
  }, [messages, error, scrollToBottom]);

  // 3. 이벤트 핸들러
  const handleSend = () => {
    const text = value;
    setValue('');
    sendMessage(text);
  };

  // CHAT-003: 칩을 선택하면 입력창에 채우는 데 그치지 않고 바로 전송한다.
  const handleSuggest = (text: string) => {
    sendMessage(text);
  };

  const lastMessageId = messages[messages.length - 1]?.id;

  // 4. 렌더링
  return (
    <div className="flex h-dvh flex-col bg-neutral-off-white">
      {/* height-header, height-chat-input 만큼 여백을 준다 (메시지가 가려지지 않도록) */}
      <div
        ref={scrollAreaRef}
        className="flex flex-1 flex-col overflow-y-auto pt-(--height-header) pb-(--height-chat-input)"
      >
        {/* 채팅 내역 영역 */}
        <div className="flex flex-col gap-6 px-4 py-6">
          <AiMessage content={WELCOME_MESSAGE} createdAt={WELCOME_CREATED_AT} />

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
                    <div className="flex w-full flex-col gap-3">
                      {message.recommendations.map((item) => (
                        <PlanCard
                          key={item.plan.id}
                          plan={item.plan}
                          rank={item.rank}
                          annualSavings={item.annualSavings}
                        />
                      ))}
                    </div>
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
