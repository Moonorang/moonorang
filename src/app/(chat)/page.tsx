'use client';

import ChatRoom from '@/features/chat/components/ChatRoom';
import JoinFlowCard from '@/features/join/components/JoinFlowCard';
import TestLoadingModal from '@/features/test/components/TestLoadingModal';
import TestQuestionCard from '@/features/test/components/TestQuestionCard';
import { useTestFlow } from '@/features/test/hooks/useTestFlow';

/**
 * 채팅 화면. 상담(features/chat), 성향 검사(features/test),
 * 요금제 가입(features/join)을 여기서 엮는다.
 * 세 feature 는 서로를 모르고, 검사 카드는 오버레이 슬롯으로,
 * 가입 카드는 대화 슬롯으로 대화 영역에 들어간다.
 */
export default function ChatPage() {
  // 1. 상태 및 훅
  const test = useTestFlow();

  // 2. 렌더링
  return (
    <>
      <ChatRoom
        onPlanTest={test.openTest}
        renderJoinFlow={(plan) => <JoinFlowCard plan={plan} />}
        overlay={
          test.isTestOpen ? (
            <TestQuestionCard
              currentIndex={test.currentIndex}
              selectedValue={test.selectedValue}
              onSelect={test.selectAndAdvance}
              onPrev={test.goToPrev}
              onNext={test.goToNext}
              onSkip={test.skipQuestion}
              onClose={test.closeTest}
            />
          ) : undefined
        }
      />

      {test.isResultLoading && <TestLoadingModal />}
    </>
  );
}
