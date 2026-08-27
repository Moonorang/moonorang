'use client';

import { useState } from 'react';

import {
  ChatInput,
  AiMessage,
  UserMessage,
  SuggestionChips,
  PlusMenu,
  PlanCard,
  ChatErrorNotice,
} from '@/components';

import { useChat } from '@/hooks/useChat';

export default function Home() {
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const { messages, isStreaming, error, sendMessage, retry } = useChat();

  const handleSend = () => {
    const text = value;
    setValue('');
    sendMessage(text);
  };

  const handleSuggest = (text: string) => {
    setValue(text);
  };

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <div className="flex h-dvh flex-col bg-neutral-off-white">
      {/* height-header, height-chat-input 만큼 여백을 준다 (메시지가 가려지지 않도록) */}
      <div className="flex flex-1 flex-col overflow-y-auto pt-(--height-header) pb-(--height-chat-input)">
        {/* 채팅 내역 영역 */}
        <div className="flex flex-col gap-6 px-4 py-6">
          <AiMessage
            content={`안녕하세요! 😊
저는 LG 유플러스 AI 어시스턴트 무너예요.

다음과 같은 도움을 드릴 수 있어요
• 요금제 추천해주세요
• 내 요금제 절약해주세요

궁금한 점이 있으시면 언제든지 물어보세요!`}
            createdAt={new Date('2024-01-01T14:00:00')}
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
                {message.recommendations && message.recommendations.length > 0 && (
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
        <div className="mt-auto">
          <SuggestionChips onSuggest={handleSuggest} />
        </div>
      </div>

      <PlusMenu
        isOpen={isPlusMenuOpen}
        onClose={() => setIsPlusMenuOpen(false)}
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
