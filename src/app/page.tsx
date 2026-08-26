'use client';

import { useState } from 'react';

import { ChatInput } from '@/components';

export default function Home() {
  // TODO: 실제 전송/스트리밍 로직이 붙으면 useChat 같은 훅으로 옮김.
  const [value, setValue] = useState('');

  const handleSend = () => {
    // TODO: 메시지 전송
    setValue('');
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* height-chat-input 만큼 여백을 준다 (메시지가 가려지지 않도록) */}
      <div className="flex-1 overflow-y-auto pb-(--height-chat-input)">
        {/* TODO: 메시지 목록 */}
      </div>

      <ChatInput value={value} onChange={setValue} onSend={handleSend} />
    </div>
  );
}
