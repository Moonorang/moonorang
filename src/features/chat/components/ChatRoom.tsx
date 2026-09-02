'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import AddOnRecommendationCard from '@/features/chat/components/AddOnRecommendationCard';
import AiMessage from '@/features/chat/components/AiMessage';
import ChatConflictModal from '@/features/chat/components/ChatConflictModal';
import ChatErrorNotice from '@/features/chat/components/ChatErrorNotice';
import ChatInput from '@/features/chat/components/ChatInput';
import ConditionQuestionCard from '@/features/chat/components/ConditionQuestionCard';
import NearbyMembershipCard from '@/features/chat/components/NearbyMembershipCard';
import PlanCardCarousel from '@/features/chat/components/PlanCardCarousel';
import PlusMenu from '@/features/chat/components/PlusMenu';
import ScrollToBottomButton from '@/features/chat/components/ScrollToBottomButton';
import SubscriptionRecommendationCard from '@/features/chat/components/SubscriptionRecommendationCard';
import SuggestionChips from '@/features/chat/components/SuggestionChips';
import UserMessage from '@/features/chat/components/UserMessage';
import { WELCOME_MESSAGE } from '@/features/chat/constants';
import { useChat } from '@/features/chat/hooks/useChat';
import { useConditionQuestions } from '@/features/chat/hooks/useConditionQuestions';
import type { ChatKeywords } from '@/features/chat/types';

import { takePendingChatMessage } from '@/entities/chat';
import type { Plan } from '@/entities/plan/types';
import type { UsageAnalysisResult } from '@/entities/usage/types';

/** 최하단에서 이 거리(px) 이내면 바닥에 있는 것으로 본다 */
const BOTTOM_THRESHOLD_PX = 24;

/**
 * AI가 조건(예산·데이터 사용량)을 막 물어본 시점에, 사용자가 이 단어들을 포함해서
 * 답하면 - LLM 왕복 없이 곧바로 선택형 질문 카드를 연다. 별도 버튼 UI 대신 AI가
 * 말로 "선택지로 해드릴까요, 텍스트로 하실래요?"라고 물어보고, 그 답을 여기서 감지한다.
 */
const CONDITION_CARD_KEYWORDS = ['선택지', '카드', '골라'];

/**
 * 가입 카드와 함께 남기는 안내 문구.
 * 문구가 매번 달라지면 안 되고 대화 문맥도 아니라서 모델을 거치지 않고 여기서 만든다.
 */
const PLAN_JOIN_GUIDE = `선택하신 요금제의 상세 내용을 확인해주세요!
선택하신 요금제가 맞으신가요?`;

interface ChatRoomProps {
  /**
   * 로그인 여부. features/chat이 features/auth를 직접 참조할 수 없어서 app 레이어가
   * useAuth로 확인해 내려준다. 아직 확인 전이면 undefined.
   */
  isLoggedIn?: boolean;
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
  /**
   * CARD-022~028: usageAnalysis 이벤트가 온 메시지에 끼워 넣는 사용량 분석/절약 카드.
   * features/usage도 다른 feature라 직접 참조 못 해 슬롯으로 받는다. onJoin은 이 화면이
   * 이미 갖고 있는 가입 카드 흐름(joinBlocks)에 그대로 연결해준다.
   */
  renderUsageAnalysis?: (
    data: UsageAnalysisResult,
    handlers: { onJoin: (plan: Plan) => void },
  ) => ReactNode;
}

/** 채팅 화면 본체 - 대화 내역, 추천 질문 칩, 입력창, 추가 기능 메뉴 */
export default function ChatRoom({
  isLoggedIn,
  overlay,
  onPlanTest,
  renderJoinFlow,
  renderUsageAnalysis,
}: ChatRoomProps) {
  // 1. 상태 및 훅
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const {
    messages,
    isStreaming,
    error,
    location,
    isRestored,
    keywords,
    summary,
    joinBlocks,
    chatConflict,
    sendMessage,
    retry,
    reset,
    addJoinBlock,
    setKeywordValue,
    pruneVisibleMessages,
    stopGeneration,
    keepBothConversations,
    discardGuestConversation,
  } = useChat(isLoggedIn);
  const conditionQuestions = useConditionQuestions();

  // 조건 수집 카드에서 선택한 답변을 문항이 끝날 때까지 모아뒀다가 한 번에 보낸다
  // (CARD-012: 요약을 하나의 말풍선으로 남김 - 문항마다 따로 쪼개지 않는다)
  const [conditionAnswers, setConditionAnswers] = useState<string[]>([]);
  // CARD-011: 조건 수집 카드의 기타(직접 입력)가 열려 있는 동안, 하단 채팅
  // 입력창도 같이 열어 두면 두 군데에 동시에 타이핑하는 것처럼 보여 혼란스럽다 -
  // 열려 있는 동안은 채팅 입력창을 막는다. setState 함수는 항상 같은 참조라
  // ConditionQuestionCard에 그대로 넘겨도 매 렌더마다 새 함수가 되지 않는다.
  const [isConditionFreeTextEditing, setIsConditionFreeTextEditing] =
    useState(false);

  // 바닥에 있는지 여부 - 자동 스크롤 여부와 버튼 노출을 함께 결정한다
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // 밖에서 밀어 넣은 메시지처럼, 바닥에 있지 않아도 한 번은 끌어내려야 하는 경우
  const shouldForceScrollRef = useRef(false);

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
    if (!isAtBottom && !shouldForceScrollRef.current) return;

    shouldForceScrollRef.current = false;
    scrollToBottom();
  }, [messages, joinBlocks, error, isAtBottom, scrollToBottom]);

  // 화면 유지 상한을 넘긴 오래된(이미 요약된) 턴은, 사용자가 맨 아래를 보고 있을 때만
  // 걷어낸다 - 과거 대화를 스크롤해서 보는 도중에 눈앞에서 사라지는 걸 막기 위함.
  useEffect(() => {
    if (isAtBottom) pruneVisibleMessages();
  }, [isAtBottom, messages.length, pruneVisibleMessages]);

  // 요금제 목록 등 채팅 밖에서 "이 말로 시작해달라"고 남겨둔 메시지가 있으면 대신 보낸다.
  // 사용자가 직접 친 것과 똑같이 처리되므로(SuggestionChips 와 같은 경로) 이후 대화가
  // 그 요금제를 문맥으로 물고 간다.
  //
  // isRestored 를 기다리는 이유: 복구는 messages 를 통째로 덮어써서, 그전에 보낸
  // 메시지는 소리 없이 사라진다. 훅 호출 순서에 기대지 않고 복구 완료를 직접 확인한다.
  // 한 번만 나가는 것은 takePendingChatMessage 가 꺼내면서 지우는 것으로 보장된다 -
  // effect 가 다시 돌아도, 새로고침을 해도 두 번째부터는 값이 없다.
  useEffect(() => {
    if (!isRestored) return;

    const pendingMessage = takePendingChatMessage();
    if (!pendingMessage) return;

    // 복구한 대화가 길면 방금 보낸 말이 화면 밖에 생긴다. "사용자가 위를 읽는 중이면
    // 끌어내리지 않는다"는 기본 규칙의 예외 - 사용자가 직접 시작한 대화라 보여줘야 한다.
    shouldForceScrollRef.current = true;
    sendMessage(pendingMessage);
  }, [isRestored, sendMessage]);

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

    // AI가 방금 조건을 물어보면서 "선택지로 해드릴까요, 텍스트로 하실래요?"라고
    // 물은 직후라면, 사용자가 선택지를 원한다는 답을 LLM 왕복 없이 바로 감지해서
    // 카드를 연다 - 버튼 없이 대화만으로 같은 선택을 할 수 있게 하기 위함이다.
    if (
      isAwaitingConditionEntryChoice &&
      CONDITION_CARD_KEYWORDS.some((keyword) => text.includes(keyword))
    ) {
      handleOpenConditionQuestions();
      return;
    }

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
      sendMessage(
        `${finalAnswers.join('\n')}\n\n이 조건으로 요금제 추천해주세요.`,
      );
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

  // CARD-029: 신청하기를 누르면 대화에 가입 카드를 한 장 띄운다.
  // 카드 목록은 useChat이 들고 있다 - 대화 내역과 같이 저장·복구돼야 하기 때문.
  const handleJoin = (plan: Plan, afterMessageId: string) => {
    setIsAtBottom(true);
    addJoinBlock(plan, afterMessageId);
  };

  // CHAT-014: 대화를 비울 때 가입 카드도, 조건 수집 진행 상태도 같이 걷어낸다
  // (가입 카드는 reset이 같이 비운다)
  const handleReset = () => {
    reset();
    setConditionAnswers([]);
    setIsConditionFreeTextEditing(false);
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
        onFreeTextEditingChange={setIsConditionFreeTextEditing}
      />
    ) : undefined);

  // AI가 방금 조건을 물어본 것으로 보이는 시점인지: 대화가 시작됐고(환영 메시지
  // 제외), 마지막 메시지가 텍스트만 있는 AI 응답이고, 예산·데이터 사용량이 아직
  // 둘 다 없을 때. systemPrompt의 "조건이 둘 다 없으면 먼저 물어보라"는 지침과
  // 같은 조건이라 실제로 되묻는 순간과 맞아떨어진다. usageAnalysis(절약 상담/
  // 사용량 추세) 응답은 조건을 되묻는 상황이 아니라서 제외한다.
  // handleSend가 이 순간의 사용자 답에서 "선택지/카드" 같은 키워드를 감지해
  // 곧바로 선택형 질문 카드를 열지 판단하는 데 쓴다(버튼 UI 없이).
  const isAwaitingConditionEntryChoice =
    !isStreaming &&
    !resolvedOverlay &&
    !!lastMessage &&
    lastMessage.role === 'ai' &&
    !lastMessage.recommendations?.length &&
    !lastMessage.usageAnalysis &&
    !keywords.budget &&
    !keywords.dataUsageGb;

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
        <div className="flex flex-col gap-3 px-4 py-6">
          <AiMessage content={WELCOME_MESSAGE} />

          {/*
            CHAT-011/012: 오래된 대화가 요약돼서 화면에서는 걷어내진 상태임을 알려주는
            안내선. summary가 있다는 건 지금 안 보이는 이전 대화가 있다는 뜻이라, 갑자기
            대화가 끊긴 것처럼 보이지 않도록 경계를 표시한다.
          */}
          {summary && (
            <div className="flex items-center gap-2 text-10 text-text-secondary">
              <span className="h-px flex-1 bg-border-light" />
              이전 대화 내용이 요약되었어요
              <span className="h-px flex-1 bg-border-light" />
            </div>
          )}

          {messages.map((message) => (
            <Fragment key={message.id}>
              {message.role === 'user' ? (
                <UserMessage content={message.content} />
              ) : (
                <AiMessage
                  content={message.content}
                  isStreaming={isStreaming && message.id === lastMessageId}
                >
                  {message.recommendations &&
                    message.recommendations.length > 0 && (
                      <PlanCardCarousel
                        recommendations={message.recommendations}
                        onJoin={(plan) => handleJoin(plan, message.id)}
                      />
                    )}
                  {message.addOnRecommendations &&
                    message.addOnRecommendations.length > 0 && (
                      <AddOnRecommendationCard
                        recommendations={message.addOnRecommendations}
                      />
                    )}
                  {message.subscriptionRecommendations &&
                    message.subscriptionRecommendations.length > 0 && (
                      <SubscriptionRecommendationCard
                        recommendations={message.subscriptionRecommendations}
                      />
                    )}
                  {message.nearbyMemberships &&
                    message.nearbyMemberships.length > 0 && (
                      <NearbyMembershipCard
                        memberships={message.nearbyMemberships}
                        userLocation={location}
                      />
                    )}
                  {message.usageAnalysis &&
                    renderUsageAnalysis?.(message.usageAnalysis, {
                      onJoin: (plan) => handleJoin(plan, message.id),
                    })}
                </AiMessage>
              )}

              {/* 이 메시지 뒤에 띄운 가입 카드 - 대화 순서를 그대로 지킨다 */}
              {joinBlocks
                .filter((block) => block.afterMessageId === message.id)
                .map((block) => (
                  <Fragment key={block.plan.id}>
                    <UserMessage
                      content={`${block.plan.name} 요금제 가입할래`}
                    />
                    <AiMessage content={PLAN_JOIN_GUIDE}>
                      {renderJoinFlow?.(block.plan)}
                    </AiMessage>
                  </Fragment>
                ))}
            </Fragment>
          ))}

          {error && <ChatErrorNotice reason={error.reason} onRetry={retry} />}
        </div>

        {/* 메시지 리스트 하단에 추천 질문 칩 배치 (입력창 위로 떠 있는 듯한 위치) */}
        {/* 최초 진입 시에만 보여준다 - AI가 조건을 물어본 시점엔 별도 버튼 UI 없이
            AI 메시지 자체가 "선택지로 해드릴까요, 텍스트로 하실래요?"라고 물어보고,
            사용자의 다음 답을 handleSend가 감지해 선택형 카드를 열지 판단한다. */}
        {messages.length === 0 && !resolvedOverlay && (
          <div className="mt-auto">
            <SuggestionChips
              onSuggest={handleSuggest}
              onPlanTest={onPlanTest}
            />
          </div>
        )}

        {/*
          대화가 짧아도 카드가 위로 밀려 올라가지 않도록 입력창 바로 위에 둔다.
          mt-auto 로 남는 공간을 흡수하고, sticky 로 스크롤해도 자리를 지킨다.
          스크롤 영역이 이미 pb-(--height-chat-input) 로 입력창 자리를 비워두므로
          여기서 또 띄우면 간격이 두 배가 된다 - bottom-0 으로 그 여백에 붙인다.
        */}
        {resolvedOverlay && (
          <div className="sticky bottom-0 z-10 mt-auto px-4 pb-1">
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
        onStop={stopGeneration}
        isLocked={isConditionFreeTextEditing}
      />

      {chatConflict && (
        <ChatConflictModal
          guestMessageCount={chatConflict.guestMessageCount}
          onKeepBoth={keepBothConversations}
          onDiscardGuest={discardGuestConversation}
        />
      )}
    </div>
  );
}
