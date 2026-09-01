'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  MAX_VISIBLE_TURNS,
  SUMMARIZE_KEEP_RECENT_TURNS,
  SUMMARIZE_TURN_THRESHOLD,
} from '@/features/chat/constants';
import { loadChatState, saveChatState, clearChatState } from '@/features/chat/lib/chatStorage';
import { parseSSEEvent } from '@/features/chat/lib/sse';
import { pruneSummarizedMessages, selectTurnsToSummarize } from '@/features/chat/lib/turns';
import type {
  ChatErrorReason,
  ChatKeywords,
  ChatMessage,
  ChatSummarizeResponseBody,
  PlanJoinBlock,
} from '@/features/chat/types';

import type { Plan } from '@/entities/plan/types';

import { createId } from '@/shared/utils/createId';

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
 *
 * CHAT-011/012: 비회원 대화는 서버 DB가 아니라 localStorage에 저장하고, 다른 화면에
 * 갔다 돌아오면 복구한다. 대화가 길어지면 오래된 구간을 요약해서 별도로 들고 있고
 * (chat-api-design.md §2.6), 화면/로컬 저장에는 최근 MAX_VISIBLE_TURNS턴만 원문으로
 * 남긴다 - messages/summary/keywords 상태는 각각 ref로도 같이 들고 있는데, 콜백 안에서
 * setState 직후의 "최신값"을 스트리밍 도중에도 스테일 없이 읽기 위함이다.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  // 재시도용: 직전 요청의 입력을 기억해둠
  const lastUserTextRef = useRef<string | null>(null);
  const lastAiMessageIdRef = useRef<string | null>(null);

  // CHAT-011: 지금까지 파악된 조건. 서버는 DB에 저장하지 않고, 매 요청마다
  // 이 값을 실어 보내고 응답의 keywords 이벤트로 갱신받는 왕복 방식으로 기억한다.
  const [keywords, setKeywords] = useState<ChatKeywords>({});
  const keywordsRef = useRef<ChatKeywords>({});

  // CARD-029: 신청하기로 띄운 가입 카드들. 대화 이력과 섞지 않고 따로 들고 있지만,
  // 화면을 벗어났다 돌아왔을 때 같이 복구돼야 해서 저장은 messages와 함께 한다.
  const [joinBlocks, setJoinBlocks] = useState<PlanJoinBlock[]>([]);
  const joinBlocksRef = useRef<PlanJoinBlock[]>([]);

  // §2.3 "대화 요약" 계층 - 화면엔 안 보이고 시스템 프롬프트에만 실어 보낸다.
  const [summary, setSummary] = useState('');
  const summaryRef = useRef('');
  // messages 중 앞에서부터 몇 턴이 summary에 이미 반영됐는지
  const summarizedTurnCountRef = useRef(0);

  // localStorage 접근은 클라이언트에서만 가능해서(SSR 시 window 없음), 마운트 후
  // 한 번만 복구한다. 초기값을 lazy useState로 곧바로 채우면 서버가 그린 빈 화면과
  // 달라져 하이드레이션이 어긋나므로, 반드시 effect에서 복구해야 한다 - 리스트 안
  // 여러 항목을 매 렌더 다시 계산하는 파생 상태가 아니라, localStorage라는 외부
  // 저장소를 딱 한 번(deps: []) 읽어와 동기화하는 것이라 이 규칙의 취지(반복 렌더로
  // 이어지는 setState)에 해당하지 않는다.
  useEffect(() => {
    const stored = loadChatState();
    if (!stored) return;

    messagesRef.current = stored.messages;
    keywordsRef.current = stored.keywords;
    summaryRef.current = stored.summary;
    summarizedTurnCountRef.current = stored.summarizedTurnCount;
    joinBlocksRef.current = stored.joinBlocks;

    /* eslint-disable react-hooks/set-state-in-effect --
       마운트 후 localStorage를 딱 한 번(deps: []) 읽어와 동기화하는 것으로, 이 규칙이
       막으려는 "반복 렌더로 이어지는 setState"가 아니다. */
    setMessages(stored.messages);
    setKeywords(stored.keywords);
    setSummary(stored.summary);
    setJoinBlocks(stored.joinBlocks);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persist = useCallback(() => {
    saveChatState({
      messages: messagesRef.current,
      summary: summaryRef.current,
      summarizedTurnCount: summarizedTurnCountRef.current,
      keywords: keywordsRef.current,
      joinBlocks: joinBlocksRef.current,
    });
  }, []);

  // ref를 setState 업데이터 안에서 갱신하면 안 된다 - 업데이터는 호출 즉시가 아니라
  // React가 렌더할 때 실행돼서, 바로 뒤에 persist()를 부르면 이전 값이 저장된다
  // (스트림 마지막에 온 recommendation이 저장에서 빠지던 원인). ref를 먼저 동기로
  // 갱신하고 그 값으로 setState 한다 - keywords/summary 가 이미 쓰는 방식과 같다.
  const updateMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      const next = updater(messagesRef.current);
      messagesRef.current = next;
      setMessages(next);
    },
    [],
  );

  /**
   * 오래된 대화를 요약해 summary에 반영한다. 응답을 사용자에게 다 보여준 뒤
   * 비동기로(await 없이) 실행해서 응답 지연에 영향을 주지 않는다(§2.6).
   * 실패해도 대화 자체는 계속되고, 다음 응답 뒤에 다시 시도된다.
   */
  const summarizeIfNeeded = useCallback(async () => {
    const selection = selectTurnsToSummarize(
      messagesRef.current,
      summarizedTurnCountRef.current,
      SUMMARIZE_TURN_THRESHOLD,
      SUMMARIZE_KEEP_RECENT_TURNS,
    );
    if (!selection) return;

    try {
      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: selection.turnsToSummarize.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          existingSummary: summaryRef.current || undefined,
        }),
      });
      if (!response.ok) return;

      const data = (await response.json()) as ChatSummarizeResponseBody;
      summaryRef.current = data.summary;
      summarizedTurnCountRef.current += selection.turnCount;
      setSummary(data.summary);
      persist();
    } catch {
      // 네트워크 실패 등 - 다음 응답 뒤에 다시 트리거되므로 조용히 넘어간다
    }
  }, [persist]);

  /**
   * 화면/로컬 저장에 원문으로 남기는 상한(MAX_VISIBLE_TURNS)을 넘으면, 이미 요약에
   * 반영된 턴부터 걷어낸다. ChatRoom이 스크롤이 맨 아래일 때만 호출해서, 사용자가
   * 과거 대화를 보는 도중에 화면에서 메시지가 사라지는 걸 막는다.
   */
  const pruneVisibleMessages = useCallback(() => {
    const result = pruneSummarizedMessages(
      messagesRef.current,
      summarizedTurnCountRef.current,
      MAX_VISIBLE_TURNS,
    );
    if (result.removedTurns === 0) return;

    messagesRef.current = result.messages;
    summarizedTurnCountRef.current -= result.removedTurns;
    setMessages(result.messages);

    // 걷어낸 메시지에 붙어있던 가입 카드는 그릴 자리가 없어졌으므로 같이 버린다 -
    // 안 그러면 화면에 안 보이는 채로 저장분에만 계속 쌓인다.
    const visibleIds = new Set(result.messages.map((message) => message.id));
    const nextJoinBlocks = joinBlocksRef.current.filter((block) =>
      visibleIds.has(block.afterMessageId),
    );
    if (nextJoinBlocks.length !== joinBlocksRef.current.length) {
      joinBlocksRef.current = nextJoinBlocks;
      setJoinBlocks(nextJoinBlocks);
    }

    persist();
  }, [persist]);

  const runChatRequest = useCallback(
    async (userText: string, aiMessageId: string) => {
      setError(null);
      setIsStreaming(true);

      const appendToAiMessage = (delta: string) => {
        updateMessages((prev) =>
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
        updateMessages((prev) =>
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

      const setAiMessageUsageAnalysis = (
        usageAnalysis: ChatMessage['usageAnalysis'],
      ) => {
        updateMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId ? { ...message, usageAnalysis } : message,
          ),
        );
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            keywords: keywordsRef.current,
            summary: summaryRef.current || undefined,
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
            } else if (parsed?.event === 'usageAnalysis') {
              setAiMessageUsageAnalysis(parsed.data);
            } else if (parsed?.event === 'error') {
              setError(parsed.data);
            }
            // 'done' 은 별도 처리 없이 스트림이 자연스럽게 끝남

            boundary = buffer.indexOf('\n\n');
          }
        }

        persist();
        // 응답을 다 보여준 뒤 비동기로 - await 하지 않는다(§2.6)
        void summarizeIfNeeded();
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
    [updateMessages, persist, summarizeIfNeeded],
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
      updateMessages((prev) => [
        ...prev,
        userMessage,
        { id: aiMessageId, role: 'ai', content: '', createdAt: now },
      ]);
      // 응답이 오기 전에 화면을 벗어나도 방금 보낸 메시지는 남아있도록 즉시 저장
      persist();

      void runChatRequest(trimmed, aiMessageId);
    },
    [isStreaming, runChatRequest, updateMessages, persist],
  );

  /** CARD-006: 실패한 요청을 직전과 동일한 입력·문맥으로 재시도한다. */
  const retry = useCallback(() => {
    const userText = lastUserTextRef.current;
    const aiMessageId = lastAiMessageIdRef.current;
    if (!userText || !aiMessageId || isStreaming) return;

    // 실패 전에 일부 토큰이 이미 쌓여있을 수 있어 비우고 다시 채운다.
    updateMessages((prev) =>
      prev.map((message) =>
        message.id === aiMessageId
          ? {
              ...message,
              content: '',
              recommendations: undefined,
              usageAnalysis: undefined,
            }
          : message,
      ),
    );

    void runChatRequest(userText, aiMessageId);
  }, [isStreaming, runChatRequest, updateMessages]);

  /**
   * CARD-029: 신청하기를 누르면 대화에 가입 카드를 한 장 띄운다.
   * 같은 요금제를 또 눌러도 카드가 여러 장 쌓이지 않게 무시한다.
   */
  const addJoinBlock = useCallback(
    (plan: Plan, afterMessageId: string) => {
      if (joinBlocksRef.current.some((block) => block.plan.id === plan.id)) {
        return;
      }

      const next = [...joinBlocksRef.current, { plan, afterMessageId }];
      joinBlocksRef.current = next;
      setJoinBlocks(next);
      persist();
    },
    [persist],
  );

  /** CHAT-014: 전체 대화 내역을 비운다. 파악해둔 조건·요약·로컬 저장분도 같이 지운다. */
  const reset = useCallback(() => {
    messagesRef.current = [];
    keywordsRef.current = {};
    summaryRef.current = '';
    summarizedTurnCountRef.current = 0;
    joinBlocksRef.current = [];

    setMessages([]);
    setError(null);
    setKeywords({});
    setSummary('');
    setJoinBlocks([]);
    lastUserTextRef.current = null;
    lastAiMessageIdRef.current = null;

    clearChatState();
  }, []);

  /**
   * CARD-008~009: 선택형 질문 카드에서 옵션을 고르면 곧바로(=LLM 왕복 없이) keywords만
   * 갱신한다. LLM 판단을 거치지 않는 결정론적 값이라 이렇게 처리하는 게 더 정확하고 빠르다.
   * 말풍선은 여기서 안 만든다 - 문항을 다 마쳤을 때 ChatRoom이 답변을 한 번에 모아
   * 하나의 메시지로 보낸다(여러 개로 쪼개지 않기 위함).
   */
  const setKeywordValue = useCallback(
    (field: keyof ChatKeywords, value: number) => {
      const next = { ...keywordsRef.current, [field]: value };
      keywordsRef.current = next;
      setKeywords(next);
      persist();
    },
    [persist],
  );

  return {
    messages,
    isStreaming,
    error,
    keywords,
    summary,
    joinBlocks,
    sendMessage,
    retry,
    reset,
    addJoinBlock,
    setKeywordValue,
    pruneVisibleMessages,
  };
}
