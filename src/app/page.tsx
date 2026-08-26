'use client';

import { useState } from 'react';

import { ChatInput, AiMessage, SuggestionChips, PlusMenu } from '@/components';

export default function Home() {
  // TODO: 실제 전송/스트리밍 로직이 붙으면 useChat 같은 훅으로 옮김.
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const handleSend = () => {
    // TODO: 메시지 전송
    setValue('');
  };

  const handleSuggest = (text: string) => {
    setValue(text);
  };

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
      />
    </div>
  );
}
