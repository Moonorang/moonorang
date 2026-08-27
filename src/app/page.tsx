'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  ChatInput,
  AiMessage,
  UserMessage,
  SuggestionChips,
  PlusMenu,
  PlanCard,
  ChatErrorNotice,
  QuestionCard,
  TestLoadingModal,
} from '@/components';

import { useChat } from '@/hooks/useChat';
import { useTestStore } from '@/stores/testStore';
import { TEST_QUESTIONS } from '@/data/testQuestions';

export default function Home() {
  const [value, setValue] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);
  const { messages, isStreaming, error, sendMessage, retry, reset } = useChat();
  const router = useRouter();
  const {
    isTestOpen,
    answers,
    currentIndex,
    openTest,
    closeTest,
    goToPrev,
    goToNext,
    selectOption,
  } = useTestStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const element = scrollAreaRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, []);

  // 메시지가 추가되거나 답변 토큰이 쌓일 때마다 최하단으로 이동한다.
  // 토큰마다 호출되므로 smooth 대신 즉시 이동 - smooth는 매 토큰마다
  // 애니메이션이 새로 시작돼 화면이 덜컹거린다.
  useEffect(() => {
    scrollToBottom();
  }, [messages, error, scrollToBottom]);

  // 로딩 모달을 잠깐 보여준 뒤 결과 화면으로 넘어간다
  useEffect(() => {
    if (!isResultLoading) return;
    const timer = setTimeout(() => router.push('/test/result'), 1200);
    return () => clearTimeout(timer);
  }, [isResultLoading, router]);

  const handleSend = () => {
    const text = value;
    setValue('');
    sendMessage(text);
  };

  // CHAT-003: 칩을 선택하면 입력창에 채우는 데 그치지 않고 바로 전송한다.
  const handleSuggest = (text: string) => {
    sendMessage(text);
  };

  // 마지막 문항까지 답하거나 건너뛰면 결과 화면으로 넘어간다.
  const goToNextOrResult = () => {
    if (currentIndex === TEST_QUESTIONS.length - 1) {
      closeTest();
      setIsResultLoading(true);
      return;
    }
    goToNext();
  };

  const handleSelectOption = (score: number) => {
    selectOption(score);
    goToNextOrResult();
  };

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <div className="flex h-dvh flex-col bg-neutral-off-white">
      {/* height-header, height-chat-input 만큼 여백을 준다 (메시지가 가려지지 않도록) */}
      <div
        ref={scrollAreaRef}
        className="flex flex-1 flex-col overflow-y-auto pt-(--height-header) pb-(--height-chat-input)"
      >
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

          {/* CARD-008: 성향 검사 문항을 대화 안에 카드로 띄운다 */}
          {isTestOpen && (
            <QuestionCard
              title="성향검사를 진행중이예요~"
              imageSrc="/images/chat/test-character.png"
              question={TEST_QUESTIONS[currentIndex]}
              currentIndex={currentIndex}
              total={TEST_QUESTIONS.length}
              selectedScore={answers[currentIndex]}
              onSelect={handleSelectOption}
              onPrev={goToPrev}
              onNext={goToNext}
              onSkip={goToNextOrResult}
              onClose={closeTest}
            />
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
        onReset={reset}
        onPlanTest={openTest}
      />
      {isResultLoading && <TestLoadingModal />}
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
