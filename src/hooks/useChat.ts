'use client';

import { useCallback, useState } from 'react';

import { parseSSEEvent } from '@/utils/parseSSE';
import type { ChatMessage } from '@/types/chat';

// /api/chat 과의 스트리밍 대화를 관리하는 훅
// recommendation 이벤트는 서버에 tool calling을 붙인 다음 처리
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      // 이전 요청이 처리 중일 때 신규 요청 차단
      if (!trimmed || isStreaming) return;

      setError(null);

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: now,
      };
      const aiMessageId = crypto.randomUUID();

      // AI 메시지를 빈 content로 먼저 넣어둔다 - AiMessage 가 이 상태를
      // "첫 토큰 대기 중"으로 알아서 표시한다 (isStreaming + content.length===0).
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: aiMessageId, role: 'ai', content: '', createdAt: now },
      ]);
      setIsStreaming(true);

      const appendToAiMessage = (delta: string) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId
              ? { ...message, content: message.content + delta }
              : message,
          ),
        );
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!response.body) {
          throw new Error('스트림 응답을 받지 못했습니다.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE 이벤트는 빈 줄로 구분
          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);

            const parsed = parseSSEEvent(rawEvent);
            if (parsed?.event === 'token') {
              appendToAiMessage(parsed.data.delta);
            } else if (parsed?.event === 'error') {
              setError(parsed.data.message);
            }
            // 'done' 은 별도 처리 없이 스트림이 자연스럽게 끝남

            boundary = buffer.indexOf('\n\n');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '요청에 실패했습니다.');
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming],
  );

  return { messages, isStreaming, error, sendMessage };
}
