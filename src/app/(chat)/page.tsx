'use client';

import KakaoLoginButton from '@/features/auth/components/KakaoLoginButton';
import { getDisplayName } from '@/features/auth/lib/getDisplayName';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ChatRoom from '@/features/chat/components/ChatRoom';
import AddOnJoinFlowCard from '@/features/join/components/AddOnJoinFlowCard';
import JoinCompleteCard from '@/features/join/components/JoinCompleteCard';
import JoinFlowCard from '@/features/join/components/JoinFlowCard';
import SubscriptionJoinFlowCard from '@/features/join/components/SubscriptionJoinFlowCard';
import { JOIN_COMPLETE_MESSAGE } from '@/features/join/data/complete';
import {
  buildAddOnJoinResultMessage,
  buildJoinResultMessage,
  buildSubscriptionJoinResultMessage,
} from '@/features/join/lib/joinResultMessage';
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
 * features/chat이 features/auth를 직접 참조할 수 없어서, 로그인 여부는 여기서
 * useAuth로 확인해 ChatRoom에 내려준다(회원 대화 DB 복구 vs 비회원 localStorage
 * 복구 분기의 기준이 된다).
 *
 * CARD-043/044: 가입 결과 문구와, 비회원에게 보여줄 카카오 회원가입 버튼도 여기서
 * 끼워 넣는다 - 요금제는 가입 쪽이, 고객 이름은 회원 쪽이 갖고 있어서 둘을 아는
 * 자리가 여기뿐이다.
 */
export default function ChatPage() {
  // 1. 상태 및 훅
  const test = useTestFlow();
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();

  // 로그인 전에는 이름을 모르니 이름 없이 '고객님'으로만 부른다
  const customerName = user ? getDisplayName(user) : undefined;

  // 2. 렌더링
  return (
    <>
      <ChatRoom
        isLoggedIn={isAuthLoading ? undefined : isLoggedIn}
        onPlanTest={test.openTest}
        renderJoinFlow={(
          block,
          { isCompleted, progress, onProgressChange, onComplete },
        ) => {
          // 종류마다 카드도 결과 문구도 달라서 여기서 가른다 - features/chat 은
          // 어떤 카드가 붙는지 모르고 자리만 잡아준다.
          const shared = {
            // 확인 중에는 undefined - 카드가 '비회원'으로 단정하고 로그인 안내를
            // 띄웠다가 곧 지우는 깜빡임을 막는다
            isLoggedIn: isAuthLoading ? undefined : isLoggedIn,
            renderSignup: () => <KakaoLoginButton />,
            isCompleted,
            progress,
            onProgressChange,
          };

          if (block.kind === 'subscription') {
            return (
              <SubscriptionJoinFlowCard
                {...shared}
                subscription={block.item}
                onComplete={() =>
                  onComplete(
                    buildSubscriptionJoinResultMessage({
                      subscriptionName: block.item.name,
                      customerName,
                    }),
                  )
                }
              />
            );
          }

          if (block.kind === 'addOn') {
            return (
              <AddOnJoinFlowCard
                {...shared}
                addOn={block.item}
                onComplete={() =>
                  onComplete(
                    buildAddOnJoinResultMessage({
                      addOnName: block.item.title,
                      customerName,
                    }),
                  )
                }
              />
            );
          }

          return (
            <JoinFlowCard
              {...shared}
              plan={block.item}
              onComplete={() =>
                onComplete(
                  buildJoinResultMessage({
                    planName: block.item.name,
                    customerName,
                  }),
                )
              }
            />
          );
        }}
        renderJoinResult={(kind) => (
          <JoinCompleteCard message={JOIN_COMPLETE_MESSAGE[kind]} />
        )}
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
