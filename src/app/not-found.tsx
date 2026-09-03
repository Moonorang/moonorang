'use client';

import { useState } from 'react';

import { LogIn, Send, Plus, Mic, Search } from 'lucide-react';
import Button from '@/shared/ui/Button';
import CarouselIndicator from '@/shared/ui/CarouselIndicator';
import CheckBox from '@/shared/ui/CheckBox';
import ConfirmModal from '@/shared/ui/ConfirmModal';
import StepProgress from '@/shared/ui/StepProgress';
import Tag from '@/shared/ui/Tag';

import PlanCard from '@/entities/plan/ui/PlanCard';
import PlanDetailCard from '@/entities/plan/ui/PlanDetailCard';

import JoinFlowCard from '@/features/join/components/JoinFlowCard';

import AiMessage from '@/features/chat/components/AiMessage';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import ChatConflictModal from '@/features/chat/components/ChatConflictModal';
import ScrollToBottomButton from '@/features/chat/components/ScrollToBottomButton';
import UserMessage from '@/features/chat/components/UserMessage';

// 임시: 모달 3종 디자인 확인용 - app/_header는 원래 라우트 전용 조립 폴더라 다른 곳에서
// 잘 안 끌어오지만, 여기는 컴포넌트 갤러리 페이지라 미리보기 목적으로만 예외적으로 가져온다.
import ExitSignupDialog from '@/app/_header/ui/ExitSignupDialog';

import UsageAnalysisSection from '@/features/usage/components/UsageAnalysisSection';
import UsageTrendChart from '@/features/usage/components/UsageTrendChart';
import type { UsageAnalysisResult } from '@/entities/usage/types';

// UsageAnalysisSection 데모용 - 채팅에서 실제로 오는 usageAnalysis 이벤트 형태 그대로.
// CARD-025~026: 사용량이 요금제 제공량보다 여유 있어서 downgrade(절약) 케이스로 구성.
const usageAnalysisDemo: UsageAnalysisResult = {
  currentPlan: {
    id: 7,
    name: '너겟49',
    description: '최대 혜택 상당액 24,400원/월',
    monthlyFee: 49000,
    dataAllowance: '120GB (소진 후 5Mbps)',
    voiceSms: '기본제공 / 기본제공 / 300분 무료',
    benefits: {
      max_benefit_value: '24,400원/월',
      tethering_sharing: '60GB',
    },
  },
  remainingDataGb: 85,
  dataLimitGb: 120,
  trend: {
    points: [
      { billingMonth: '2026-06', dataUsedMb: 8 * 1024 },
      { billingMonth: '2026-07', dataUsedMb: 12 * 1024 },
      { billingMonth: '2026-08', dataUsedMb: 9 * 1024 },
    ],
    averageMb: ((8 + 12 + 9) / 3) * 1024,
    planLimitMb: 120 * 1024,
  },
  savings: {
    type: 'downgrade',
    reason:
      '최근 3개월 평균 데이터 사용량이 약 10GB로, 지금보다 저렴한 요금제로도 충분히 커버돼요.',
    recommendedPlan: {
      plan: {
        id: 1,
        name: '너겟26',
        description: '최대 혜택 상당액 12,000원/월',
        monthlyFee: 26000,
        dataAllowance: '11GB (소진 후 1Mbps)',
        voiceSms: '기본제공 / 기본제공 / 300분 무료',
        benefits: null,
      },
      annualSavings: (49000 - 26000) * 12,
    },
  },
};

export default function NotFoundPage() {
  // 모달 3종 미리보기용 상태 (임시)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isExitDialogExiting, setIsExitDialogExiting] = useState(false);
  const [isChatConflictOpen, setIsChatConflictOpen] = useState(false);

  // OpenAI 연결 확인용 상태 (임시)
  const [testInput, setTestInput] = useState('안녕! 너 누구야?');
  const [testReply, setTestReply] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const handleTestSend = async () => {
    setIsTestLoading(true);
    setTestError('');
    setTestReply('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testInput }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류');
      setTestReply(data.reply);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : '요청 실패');
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    // COMMON-006: 다른 실제 페이지들(mypage, auth/login 등)처럼 폭을 768px로 제한하고
    // 중앙 정렬한다 - 이게 없으면 데모 박스들 때문에 페이지가 화면보다 넓어져 가로
    // 스크롤이 생기고, 스크롤을 밀어둔 채로 모달(fixed inset-0, 화면 기준 정중앙)을
    // 열면 문서 기준으로는 오른쪽에 쏠려 보이는 착시가 생긴다.
    <div className="mx-auto max-w-(--width-container) px-4 pt-(--height-header)">
      {/* 예시 1. 기본 형태 */}
      <div className="flex items-center gap-4">
        <LogIn />
        <div className="text-sm text-gray-600">
          <p className="font-bold text-gray-800">1. 기본 아이콘</p>
          <p>아무 속성을 안 주면 기본 24px 크기로 들어갑니다.</p>
        </div>
      </div>
      {/* 예시 2. 크기 조절 (size 속성) */}
      <div className="flex items-center gap-4">
        <Send size={40} />
        <div className="text-sm text-gray-600">
          <p className="font-bold text-gray-800">2. 크기 조절 (size=40)</p>
          <p>width, height 대신 size 속성을 숫자로 줍니다.</p>
        </div>
      </div>
      {/* 예시 3. 색상 변경 (Tailwind className 활용) */}
      <div className="flex items-center gap-4">
        <Plus
          size={32}
          className="rounded-full bg-pink-100 p-1 text-pink-500"
        />
        <div className="text-sm text-gray-600">
          <p className="font-bold text-gray-800">
            3. 색상 변경 (text-pink-500)
          </p>
          <p>Tailwind의 text 색상 클래스로 쉽게 색을 바꿉니다.</p>
        </div>
      </div>
      {/* 예시 4. 선 굵기 조절 및 Hover 효과 */}
      <div className="flex items-center gap-4">
        <Mic
          size={32}
          strokeWidth={1.5}
          className="cursor-pointer text-gray-400 transition-colors hover:text-blue-500"
        />
        <div className="text-sm text-gray-600">
          <p className="font-bold text-gray-800">
            4. 굵기 및 마우스 오버(Hover)
          </p>
          <p>strokeWidth로 굵기를 얇게(1.5) 하고, hover 색상을 줬습니다.</p>
        </div>
      </div>
      {/* 예시 5. 실전 응용 (버튼 안에 넣기) */}
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-white transition-all hover:bg-gray-800 active:scale-95">
        <Search size={18} />
        <span className="font-bold">실전: 검색 버튼 만들기</span>
      </button>
      만든 컴포넌트 목록
      <br />
      요금제 카드
      <div className="m-5 w-70">
        <PlanCard
          plan={{
            id: 11,
            name: '너겟75',
            description: '최대 혜택 상당액 73,600원/월',
            monthlyFee: 75000,
            dataAllowance: '무제한',
            voiceSms: '기본제공 / 기본제공 / 300분 무료',
            benefits: {
              media_contents: '콘텐츠·음악 감상 등 최대 15,000원/월',
              vip_membership:
                'VIP콕 7,000원/월 (네이버플러스 선택 시 무료 영화 예매)',
              max_benefit_value: '73,600원/월',
              tethering_sharing: '100GB',
            },
          }}
          rank={1}
          annualSavings={432000}
          onViewDetail={() => {}}
          onJoin={() => {}}
        />
      </div>
      <br />
      요금제 상세 카드 (채팅에서 신청하기를 누르면 뜨는 카드)
      <div className="m-5 w-90 rounded-md bg-background-default p-4">
        <PlanDetailCard
          plan={{
            id: 11,
            name: '너겟75',
            description: '최대 혜택 상당액 73,600원/월',
            monthlyFee: 75000,
            dataAllowance: '무제한',
            voiceSms: '기본제공 / 기본제공 / 300분 무료',
            benefits: {
              media_contents: '콘텐츠·음악 감상 등 최대 15,000원/월',
              vip_membership:
                'VIP콕 7,000원/월 (네이버플러스 선택 시 무료 영화 예매)',
              max_benefit_value: '73,600원/월',
              tethering_sharing: '100GB',
            },
          }}
          onJoin={() => {}}
        />
      </div>
      <br />
      요금제 가입 절차 카드 (상세 확인 - 약관 동의 - 본인 확인 순으로 카드 한
      장의 내용만 바뀜. 하단 버튼과 좌측 상단 화살표로 이동)
      <div className="m-5 w-90">
        <JoinFlowCard
          plan={{
            id: 11,
            name: '너겟75',
            description: '최대 혜택 상당액 73,600원/월',
            monthlyFee: 75000,
            dataAllowance: '무제한',
            voiceSms: '기본제공 / 기본제공 / 300분 무료',
            benefits: {
              media_contents: '콘텐츠·음악 감상 등 최대 15,000원/월',
              vip_membership:
                'VIP콕 7,000원/월 (네이버플러스 선택 시 무료 영화 예매)',
              max_benefit_value: '73,600원/월',
              tethering_sharing: '100GB',
            },
          }}
        />
      </div>
      <br />
      데이터 사용량 추세 차트 (CARD-024/028 - 요금제 제공량이 실사용량보다 훨씬
      크면 위쪽 22% 구간을 압축해서 한계선을 표시함)
      <div className="m-5 flex flex-wrap gap-4">
        <div className="w-80 rounded-md bg-background-default p-4 shadow-default">
          <p className="mb-2 text-12 font-bold text-text-primary">
            일반(한계선 근처)
          </p>
          <UsageTrendChart
            points={[
              { billingMonth: '2026-06', dataUsedMb: 62 * 1024 },
              { billingMonth: '2026-07', dataUsedMb: 78 * 1024 },
              { billingMonth: '2026-08', dataUsedMb: 92 * 1024 },
            ]}
            averageMb={((62 + 78 + 92) / 3) * 1024}
            planLimitMb={120 * 1024}
          />
        </div>
        <div className="w-80 rounded-md bg-background-default p-4 shadow-default">
          <p className="mb-2 text-12 font-bold text-text-primary">
            여유 많음(압축 구간 발동)
          </p>
          <UsageTrendChart
            points={[
              { billingMonth: '2026-06', dataUsedMb: 8 * 1024 },
              { billingMonth: '2026-07', dataUsedMb: 12 * 1024 },
              { billingMonth: '2026-08', dataUsedMb: 9 * 1024 },
            ]}
            averageMb={((8 + 12 + 9) / 3) * 1024}
            planLimitMb={120 * 1024}
          />
        </div>
        <div className="w-80 rounded-md bg-background-default p-4 shadow-default">
          <p className="mb-2 text-12 font-bold text-text-primary">
            무제한 요금제(한계선 없음)
          </p>
          <UsageTrendChart
            points={[
              { billingMonth: '2026-06', dataUsedMb: 45 * 1024 },
              { billingMonth: '2026-07', dataUsedMb: 60 * 1024 },
              { billingMonth: '2026-08', dataUsedMb: 55 * 1024 },
            ]}
            averageMb={((45 + 60 + 55) / 3) * 1024}
            planLimitMb={null}
          />
        </div>
        <div className="w-80 rounded-md bg-background-default p-4 shadow-default">
          <p className="mb-2 text-12 font-bold text-text-primary">
            거의 다 참(평균선·한계선 겹침 방지 확인용)
          </p>
          <UsageTrendChart
            points={[
              { billingMonth: '2026-06', dataUsedMb: 118 * 1024 },
              { billingMonth: '2026-07', dataUsedMb: 119 * 1024 },
              { billingMonth: '2026-08', dataUsedMb: 120 * 1024 },
            ]}
            averageMb={((118 + 119 + 120) / 3) * 1024}
            planLimitMb={120 * 1024}
          />
        </div>
        <div className="w-80 rounded-md bg-background-default p-4 shadow-default">
          <p className="mb-2 text-12 font-bold text-text-primary">
            데이터 거의 안 씀(그리드가 GB 단위로 커지지 않는지 확인용)
          </p>
          <UsageTrendChart
            points={[
              { billingMonth: '2026-06', dataUsedMb: 1.2 * 1024 },
              { billingMonth: '2026-07', dataUsedMb: 1.8 * 1024 },
              { billingMonth: '2026-08', dataUsedMb: 1.5 * 1024 },
            ]}
            averageMb={((1.2 + 1.8 + 1.5) / 3) * 1024}
            planLimitMb={120 * 1024}
          />
        </div>
      </div>
      <br />
      개인화 카드 전체 조합 (채팅에서 usageAnalysis 이벤트가 오면 실제로 뜨는
      형태 - 사용량 분석 카드 + 위 차트 + 절약 대안 요금제)
      <div className="m-5 w-90 rounded-md bg-background-subtle p-4">
        <UsageAnalysisSection data={usageAnalysisDemo} onJoin={() => {}} />
      </div>
      <br />
      AI 어시스턴트 프로필
      <ChatAvatar></ChatAvatar>
      요금제 채팅 (components/chat에 AiMessage와 UserMessage를 적절하게 사용하면
      됨)
      <div className="w-100">
        <AiMessage content="요금제를 추천해드릴게요." />
        <UserMessage content="내 요금제 추천해줘." />
      </div>
      버튼 종류
      {/* variant */}
      <p className="mt-4 text-12 font-bold text-text-primary">variant</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="main">main</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="answer">answer</Button>
        <Button variant="filter">filter</Button>
        <Button variant="outline">outline</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="gradient">gradient</Button>
      </div>
      {/* radius */}
      <p className="mt-4 text-12 font-bold text-text-primary">radius</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="main" radius="sm">
          sm
        </Button>
        <Button variant="main" radius="md">
          md
        </Button>
        <Button variant="main" radius="full">
          full
        </Button>
      </div>
      {/* size - none 은 패딩이 없어서 아이콘 전용 버튼에 쓴다 */}
      <p className="mt-4 text-12 font-bold text-text-primary">size</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="none" appendClassName="h-10 w-10">
          <Plus size={18} aria-hidden />
        </Button>
        <Button variant="outline" size="sm">
          sm
        </Button>
        <Button variant="outline" size="md">
          md
        </Button>
        <Button variant="outline" size="lg">
          lg
        </Button>
        <Button variant="outline" size="xl">
          xl
        </Button>
      </div>
      {/* gap - 아이콘 + 라벨 사이 간격 */}
      <p className="mt-4 text-12 font-bold text-text-primary">gap</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="answer" gap="sm">
          <Search size={14} aria-hidden /> gap sm
        </Button>
        <Button variant="answer" gap="md">
          <Search size={14} aria-hidden /> gap md
        </Button>
      </div>
      {/* isFullWidth */}
      <p className="mt-4 text-12 font-bold text-text-primary">isFullWidth</p>
      <div className="mt-1">
        <Button variant="main" isFullWidth>
          꽉 채운 버튼
        </Button>
      </div>
      {/* isActive - ghost variant 의 토글 강조 (채팅 입력창 + 버튼 등) */}
      <p className="mt-4 text-12 font-bold text-text-primary">
        isActive (ghost)
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Button
          variant="ghost"
          radius="sm"
          size="none"
          appendClassName="h-10 w-10"
        >
          <Plus size={18} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          radius="sm"
          size="none"
          isActive
          appendClassName="h-10 w-10"
        >
          <Plus size={18} aria-hidden />
        </Button>
      </div>
      <br />
      인디케이터
      <CarouselIndicator total={3} activeIndex={2} />
      <br />
      단계 진행 표시줄 (요금제 가입 절차)
      <div className="m-5 w-90">
        <StepProgress total={4} currentIndex={1} ariaLabel="예시 진행 상황" />
      </div>
      체크박스 (선택 / 미선택)
      <div className="m-5 flex items-center gap-2">
        <CheckBox
          id="preview-checkbox-on"
          isChecked
          onChange={() => {}}
          ariaLabel="선택된 체크박스"
        />
        <CheckBox
          id="preview-checkbox-off"
          isChecked={false}
          onChange={() => {}}
          ariaLabel="선택되지 않은 체크박스"
        />
      </div>
      태그
      <br />
      <Tag>추천1위 기본적으로 쓰이는 태그</Tag>
      <br />
      <br />
      최하단 이동 버튼 (채팅 화면에서 위로 스크롤했을 때만 노출됨)
      <div className="m-5">
        <ScrollToBottomButton onClick={() => {}} />
      </div>
      <br />
      모달 3종 (ConfirmModal 통일 버전 - CHAT-014 대화 초기화 / AUTH-004 가입 이탈 /
      로그인 시 회원·게스트 대화 충돌. 셋 다 내부적으로 같은 ConfirmModal을 씀)
      <div className="m-5 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setIsResetModalOpen(true)}>
          1. ConfirmModal (대화 초기화)
        </Button>
        <Button variant="outline" onClick={() => setIsExitDialogOpen(true)}>
          2. ExitSignupDialog (가입 이탈)
        </Button>
        <Button variant="outline" onClick={() => setIsChatConflictOpen(true)}>
          3. ChatConflictModal (대화 충돌)
        </Button>
        <Button
          variant={isExitDialogExiting ? 'main' : 'ghost'}
          onClick={() => setIsExitDialogExiting((prev) => !prev)}
        >
          2번의 &quot;나가는 중...&quot; 상태 미리보기: {isExitDialogExiting ? 'ON' : 'OFF'}
        </Button>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        title="대화를 초기화할까요?"
        description="지금까지 나눈 대화와 진행 중인 가입 카드가 모두 사라져요. 되돌릴 수 없어요."
        confirmLabel="초기화"
        onConfirm={() => setIsResetModalOpen(false)}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {isExitDialogOpen && (
        <ExitSignupDialog
          isExiting={isExitDialogExiting}
          onCancel={() => setIsExitDialogOpen(false)}
          onConfirm={() => setIsExitDialogOpen(false)}
        />
      )}

      {isChatConflictOpen && (
        <ChatConflictModal
          guestMessageCount={3}
          onKeepBoth={() => setIsChatConflictOpen(false)}
          onDiscardGuest={() => setIsChatConflictOpen(false)}
        />
      )}
      <br />
      OpenAI 연결 확인 (임시)
      <div className="m-5 flex max-w-100 flex-col gap-2">
        <input
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="rounded-md border border-border-default px-3 py-2 text-14"
        />
        <Button
          variant="main"
          onClick={handleTestSend}
          disabled={isTestLoading}
        >
          {isTestLoading ? '요청 중...' : '전송'}
        </Button>

        {testReply && (
          <p className="rounded-md bg-action-secondary-light p-3 text-14">
            {testReply}
          </p>
        )}
        {testError && (
          <p className="rounded-md bg-action-primary-light p-3 text-14 text-action-primary">
            {testError}
          </p>
        )}
      </div>
    </div>
  );
}
