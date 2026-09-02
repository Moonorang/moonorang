'use client';

import KakaoLoginButton from '@/features/auth/components/KakaoLoginButton';
import { getDisplayName } from '@/features/auth/lib/getDisplayName';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ChatRoom from '@/features/chat/components/ChatRoom';
import JoinCompleteCard from '@/features/join/components/JoinCompleteCard';
import JoinFlowCard from '@/features/join/components/JoinFlowCard';
import { buildJoinResultMessage } from '@/features/join/lib/joinResultMessage';
import TestLoadingModal from '@/features/test/components/TestLoadingModal';
import TestQuestionCard from '@/features/test/components/TestQuestionCard';
import { useTestFlow } from '@/features/test/hooks/useTestFlow';
import UsageAnalysisSection from '@/features/usage/components/UsageAnalysisSection';

/**
 * 채팅 화면. 상담(features/chat), 성향 검사(features/test),
 * 요금제 가입(features/join)을 여기서 엮는다.
 * 세 feature 는 서로를 모르고, 검사 카드는 오버레이 슬롯으로,
 * 가입 카드는 대화 슬롯으로 대화 영역에 들어간다.
 *
 * CARD-043/044: 가입 결과 문구와, 비회원에게 보여줄 카카오 회원가입 버튼도 여기서
 * 끼워 넣는다 - 요금제는 가입 쪽이, 고객 이름과 로그인 여부는 회원 쪽이 갖고 있어서
 * 둘을 아는 자리가 여기뿐이다.
 */
export default function ChatPage() {
  // 1. 상태 및 훅
  const test = useTestFlow();
  const { user, isLoggedIn } = useAuth();

  // 로그인 전에는 이름을 모르니 이름 없이 '고객님'으로만 부른다
  const customerName = user ? getDisplayName(user) : undefined;

  // 2. 렌더링
  return (
    <>
      <ChatRoom
        isLoggedIn={isLoggedIn}
        onPlanTest={test.openTest}
        renderJoinFlow={(
          plan,
          { isCompleted, progress, onProgressChange, onComplete },
        ) => (
          <JoinFlowCard
            plan={plan}
            isLoggedIn={isLoggedIn}
            renderSignup={() => <KakaoLoginButton />}
            isCompleted={isCompleted}
            progress={progress}
            onProgressChange={onProgressChange}
            onComplete={() =>
              onComplete(
                buildJoinResultMessage({ planName: plan.name, customerName }),
              )
            }
          />
        )}
        renderJoinResult={() => <JoinCompleteCard />}
        renderUsageAnalysis={(data, { onJoin }) => (
          <UsageAnalysisSection data={data} onJoin={onJoin} />
        )}
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
