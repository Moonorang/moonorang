'use client';

import { useCallback, useRef, useState } from 'react';

import { createId } from '@/shared/utils/createId';
import { parseSSEEvent } from '@/features/chat/lib/sse';
import type {
  ChatErrorReason,
  ChatKeywords,
  ChatMessage,
} from '@/features/chat/types';

export interface ChatError {
  reason: ChatErrorReason;
  message: string;
}

/**
 * /api/chat 과의 스트리밍 대화를 관리하는 훅.
 *
 * sendMessage 와 retry 는 실제 스트림 처리 로직(runChatRequest)을 공유함 -
 * retry 는 사용자 말풍선을 새로 만들지 않고, 실패했던 AI 메시지 자리에
 * 직전과 동일한 입력으로 다시 채워 넣음
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  // 재시도용: 직전 요청의 입력을 기억해둠
  const lastUserTextRef = useRef<string | null>(null);
  const lastAiMessageIdRef = useRef<string | null>(null);

  // CHAT-011: 지금까지 파악된 조건. 서버는 DB에 저장하지 않고, 매 요청마다
  // 이 값을 실어 보내고 응답의 keywords 이벤트로 갱신받는 왕복 방식으로 기억한다.
  const [keywords, setKeywords] = useState<ChatKeywords>({});
  const keywordsRef = useRef<ChatKeywords>({});

  const runChatRequest = useCallback(
    async (userText: string, aiMessageId: string) => {
      setError(null);
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

      const setAiMessageRecommendations = (
        recommendations: ChatMessage['recommendations'],
      ) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId
              ? { ...message, recommendations }
              : message,
          ),
        );
      };

      const updateKeywords = (next: ChatKeywords) => {
        keywordsRef.current = next;
        setKeywords(next);
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            keywords: keywordsRef.current,
          }),
        });

        if (!response.body) {
          setError({
            reason: 'runtime_unavailable',
            message: '스트림 응답을 받지 못했습니다.',
          });
          return;
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
            } else if (parsed?.event === 'recommendation') {
              setAiMessageRecommendations(parsed.data.plans);
            } else if (parsed?.event === 'keywords') {
              updateKeywords(parsed.data.keywords);
            } else if (parsed?.event === 'error') {
              setError(parsed.data);
            }
            // 'done' 은 별도 처리 없이 스트림이 자연스럽게 끝남

            boundary = buffer.indexOf('\n\n');
          }
        }
      } catch {
        // 네트워크 단절 등 - LLM 자체 오류(runtime_unavailable)와 구분해서 보여줄 이유가
        // 없어서 같은 사유로 묶음
        setError({
          reason: 'runtime_unavailable',
          message: '요청을 보내지 못했습니다. 네트워크 상태를 확인해주세요.',
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      // LLM-008: 이전 요청이 처리 중이면 신규 요청을 막는다.
      if (!trimmed || isStreaming) return;

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        createdAt: now,
      };
      const aiMessageId = createId();

      lastUserTextRef.current = trimmed;
      lastAiMessageIdRef.current = aiMessageId;

      // AI 메시지를 빈 content로 먼저 넣어둔다 - AiMessage 가 이 상태를
      // "첫 토큰 대기 중"으로 알아서 표시한다 (isStreaming + content.length===0).
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: aiMessageId, role: 'ai', content: '', createdAt: now },
      ]);

      void runChatRequest(trimmed, aiMessageId);
    },
    [isStreaming, runChatRequest],
  );

  /** CARD-006: 실패한 요청을 직전과 동일한 입력·문맥으로 재시도한다. */
  const retry = useCallback(() => {
    const userText = lastUserTextRef.current;
    const aiMessageId = lastAiMessageIdRef.current;
    if (!userText || !aiMessageId || isStreaming) return;

    // 실패 전에 일부 토큰이 이미 쌓여있을 수 있어 비우고 다시 채운다.
    setMessages((prev) =>
      prev.map((message) =>
        message.id === aiMessageId
          ? { ...message, content: '', recommendations: undefined }
          : message,
      ),
    );

    void runChatRequest(userText, aiMessageId);
  }, [isStreaming, runChatRequest]);

  /** CHAT-014: 전체 대화 내역을 비운다. 파악해둔 조건도 새 대화로 취급해 같이 지운다. */
  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    lastUserTextRef.current = null;
    lastAiMessageIdRef.current = null;
    keywordsRef.current = {};
    setKeywords({});
  }, []);

  return { messages, isStreaming, error, keywords, sendMessage, retry, reset };
}
