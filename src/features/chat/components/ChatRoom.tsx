'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import AiMessage from '@/features/chat/components/AiMessage';
import ChatErrorNotice from '@/features/chat/components/ChatErrorNotice';
import ChatInput from '@/features/chat/components/ChatInput';
import ConditionEntryChips from '@/features/chat/components/ConditionEntryChips';
import ConditionQuestionCard from '@/features/chat/components/ConditionQuestionCard';
import PlanCardCarousel from '@/features/chat/components/PlanCardCarousel';
import PlusMenu from '@/features/chat/components/PlusMenu';
import ScrollToBottomButton from '@/features/chat/components/ScrollToBottomButton';
import SuggestionChips from '@/features/chat/components/SuggestionChips';
import UserMessage from '@/features/chat/components/UserMessage';
import { WELCOME_CREATED_AT, WELCOME_MESSAGE } from '@/features/chat/constants';
import { useChat } from '@/features/chat/hooks/useChat';
import { useConditionQuestions } from '@/features/chat/hooks/useConditionQuestions';
import type { ChatKeywords } from '@/features/chat/types';

import type { Plan } from '@/entities/plan/types';

/** 최하단에서 이 거리(px) 이내면 바닥에 있는 것으로 본다 */
const BOTTOM_THRESHOLD_PX = 24;

/**
 * 가입 카드와 함께 남기는 안내 문구.
 * 문구가 매번 달라지면 안 되고 대화 문맥도 아니라서 모델을 거치지 않고 여기서 만든다.
 */
const PLAN_JOIN_GUIDE = `선택하신 요금제의 상세 내용을 확인해주세요!
선택하신 요금제가 맞으신가요?`;

/** 신청하기로 띄운 가입 카드 한 장 */
interface PlanJoinBlock {
  plan: Plan;
  /** 이 메시지 바로 뒤에 끼워 넣는다 - 대화 순서를 지키기 위한 것 */
  afterMessageId: string;
  createdAt: string;
}

interface ChatRoomProps {
  /**
   * 대화 영역 하단에 끼워 넣을 카드 (성향 검사 문항 등).
   * 값이 있으면 떠 있는 것으로 보고 추천 질문 칩을 감춘다.
   */
  overlay?: ReactNode;
  /** CHAT-015: 추가 기능 메뉴의 '요금제 성향 검사' 진입 */
  onPlanTest?: () => void;
  /**
   * CARD-029: 신청하기로 띄우는 가입 카드.
   * 대화 순서에 맞는 자리는 여기서 잡고, 카드 자체는 바깥에서 그린다
   * (features 끼리 직접 참조하지 않기 위한 슬롯).
   */
  renderJoinFlow?: (plan: Plan) => ReactNode;
}

/** 채팅 화면 본체 - 대화 내역, 추천 질문 칩, 입력창, 추가 기능 메뉴 */
export default function ChatRoom({
  overlay,
  onPlanTest,
  renderJoinFlow,
}: ChatRoomProps) {
  // 1. 상태 및 훅
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const {
    messages,
    isStreaming,
    error,
    keywords,
    sendMessage,
    retry,
    reset,
    setKeywordValue,
  } = useChat();
  const conditionQuestions = useConditionQuestions();

  // 조건 수집 카드에서 선택한 답변을 문항이 끝날 때까지 모아뒀다가 한 번에 보낸다
  // (CARD-012: 요약을 하나의 말풍선으로 남김 - 문항마다 따로 쪼개지 않는다)
  const [conditionAnswers, setConditionAnswers] = useState<string[]>([]);

  // "텍스트로 답할게요"를 누르면, 그 시점의 마지막 AI 메시지에 한해서만 칩을 숨긴다.
  // 다음 AI 메시지가 오면 lastMessageId가 바뀌므로 자동으로 다시 평가된다.
  const [dismissedEntryChipsFor, setDismissedEntryChipsFor] = useState<
    string | null
  >(null);

  // 바닥에 있는지 여부 - 자동 스크롤 여부와 버튼 노출을 함께 결정한다
  const [isAtBottom, setIsAtBottom] = useState(true);
  // 신청하기로 띄운 가입 카드들. 대화 이력(messages)과 섞지 않고 따로 들고 있는다
  const [joinBlocks, setJoinBlocks] = useState<PlanJoinBlock[]>([]);

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
  }, [messages, joinBlocks, error, isAtBottom, scrollToBottom]);

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

  const handleOpenConditionQuestions = () => {
    setConditionAnswers([]);
    conditionQuestions.open();
  };

  // 카드를 닫는 시점(마지막 문항 응답/건너뛰기, 또는 X)에 모아둔 답변을 한 번에 보낸다.
  // 답변이 하나도 없으면(바로 닫기만 한 경우) 아무것도 안 보낸다.
  const finishConditionQuestions = (finalAnswers: string[]) => {
    conditionQuestions.close();
    setConditionAnswers([]);

    if (finalAnswers.length > 0) {
      sendMessage(`${finalAnswers.join('\n')}\n\n이 조건으로 요금제 추천해주세요.`);
    }
  };

  // CARD-008~009: 선택지를 고르면 keywords에 즉시 반영하고, 답변은 버퍼에 모아둔다.
  // 마지막 문항이면 여기서 바로 마무리(전송)까지 한다.
  const handleConditionSelect = (
    field: keyof ChatKeywords,
    value: number,
    summaryText: string,
  ) => {
    setKeywordValue(field, value);
    const nextAnswers = [...conditionAnswers, summaryText];

    if (conditionQuestions.isLastQuestion) {
      finishConditionQuestions(nextAnswers);
    } else {
      setConditionAnswers(nextAnswers);
      conditionQuestions.goToNext();
    }
  };

  const handleConditionSkip = () => {
    if (conditionQuestions.isLastQuestion) {
      finishConditionQuestions(conditionAnswers);
    } else {
      conditionQuestions.goToNext();
    }
  };

  // CARD-011: 직접 입력은 그 자체로 하나의 메시지라 곧바로 보낸다 - 버퍼에 안 쌓는다.
  const handleConditionFreeText = (text: string) => {
    sendMessage(text);

    if (conditionQuestions.isLastQuestion) {
      conditionQuestions.close();
      setConditionAnswers([]);
    } else {
      conditionQuestions.goToNext();
    }
  };

  // CARD-029: 신청하기를 누르면 대화에 가입 카드를 한 장 띄운다
  const handleJoin = (plan: Plan, afterMessageId: string) => {
    // 같은 요금제를 또 누르면 무시한다 - 같은 카드가 여러 장 쌓이지 않게
    if (joinBlocks.some((block) => block.plan.id === plan.id)) return;

    setIsAtBottom(true);
    setJoinBlocks((prev) => [
      ...prev,
      { plan, afterMessageId, createdAt: new Date().toISOString() },
    ]);
  };

  // CHAT-014: 대화를 비울 때 가입 카드도, 조건 수집 진행 상태도 같이 걷어낸다
  const handleReset = () => {
    reset();
    setJoinBlocks([]);
    setConditionAnswers([]);
    setDismissedEntryChipsFor(null);
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?.id;

  // features/test 오버레이(부모가 넘김)와 조건 수집 카드(이 컴포넌트가 직접 엶)를
  // 같은 슬롯에서 다룬다 - 둘 다 "대화 영역 아래에 뜨는 카드"라 위치·스타일이 같다.
  const resolvedOverlay =
    overlay ??
    (conditionQuestions.isOpen ? (
      <ConditionQuestionCard
        currentIndex={conditionQuestions.currentIndex}
        keywords={keywords}
        onSelect={handleConditionSelect}
        onFreeText={handleConditionFreeText}
        onPrev={conditionQuestions.goToPrev}
        onNext={conditionQuestions.goToNext}
        onSkip={handleConditionSkip}
        onClose={() => finishConditionQuestions(conditionAnswers)}
      />
    ) : undefined);

  // AI가 방금 조건을 물어본 것으로 보이는 시점에만 진입 칩을 보여준다:
  // 대화가 시작됐고(환영 메시지 제외), 마지막 메시지가 텍스트만 있는 AI 응답이고,
  // 예산·데이터 사용량이 아직 둘 다 없을 때. systemPrompt의 "조건이 둘 다 없으면
  // 먼저 물어보라"는 지침과 같은 조건이라 실제로 되묻는 순간과 맞아떨어진다.
  const shouldShowConditionEntryChips =
    !isStreaming &&
    !resolvedOverlay &&
    !!lastMessage &&
    lastMessage.role === 'ai' &&
    !lastMessage.recommendations?.length &&
    !keywords.budget &&
    !keywords.dataUsageGb &&
    dismissedEntryChipsFor !== lastMessageId;

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
          <AiMessage content={WELCOME_MESSAGE} createdAt={WELCOME_CREATED_AT} />

          {messages.map((message) => (
            <Fragment key={message.id}>
              {message.role === 'user' ? (
                <UserMessage
                  content={message.content}
                  createdAt={message.createdAt}
                />
              ) : (
                <AiMessage
                  content={message.content}
                  createdAt={message.createdAt}
                  isStreaming={isStreaming && message.id === lastMessageId}
                >
                  {message.recommendations &&
                    message.recommendations.length > 0 && (
                      <PlanCardCarousel
                        recommendations={message.recommendations}
                        onJoin={(plan) => handleJoin(plan, message.id)}
                      />
                    )}
                </AiMessage>
              )}

              {/* 이 메시지 뒤에 띄운 가입 카드 - 대화 순서를 그대로 지킨다 */}
              {joinBlocks
                .filter((block) => block.afterMessageId === message.id)
                .map((block) => (
                  <Fragment key={block.plan.id}>
                    <UserMessage
                      content={`${block.plan.name} 요금제 가입할래`}
                      createdAt={block.createdAt}
                    />
                    <AiMessage content={PLAN_JOIN_GUIDE} createdAt={block.createdAt}>
                      {renderJoinFlow?.(block.plan)}
                    </AiMessage>
                  </Fragment>
                ))}
            </Fragment>
          ))}

          {error && <ChatErrorNotice reason={error.reason} onRetry={retry} />}
        </div>

        {/* 메시지 리스트 하단에 칩 버튼 배치 (입력창 위로 떠 있는 듯한 위치) */}
        {/* 최초 진입 시엔 추천 질문 칩을, AI가 조건을 물어본 시점엔 답변 방식 선택 칩을,
            오버레이 카드가 떠 있는 동안엔 아무 칩도 안 보여준다. */}
        {messages.length === 0 && !resolvedOverlay && (
          <div className="mt-auto">
            <SuggestionChips onSuggest={handleSuggest} />
          </div>
        )}
        {shouldShowConditionEntryChips && (
          <div className="mt-auto">
            <ConditionEntryChips
              onChooseText={() => setDismissedEntryChipsFor(lastMessageId ?? null)}
              onChooseCard={handleOpenConditionQuestions}
            />
          </div>
        )}

        {/*
          대화가 짧아도 카드가 위로 밀려 올라가지 않도록 입력창 바로 위에 둔다.
          mt-auto 로 남는 공간을 흡수하고, sticky 로 스크롤해도 자리를 지킨다.
          scrollport 는 패딩 박스라 bottom-0 이면 고정된 입력창에 가린다 -
          입력창 높이만큼 띄운다.
        */}
        {resolvedOverlay && (
          <div className="sticky bottom-(--height-chat-input) z-10 mt-auto px-4 pb-4">
            {resolvedOverlay}
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
        onReset={handleReset}
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
