'use client';

import { useState } from 'react';

import { LogIn, Send, Plus, Mic, Search } from 'lucide-react';
import Button from '@/shared/ui/Button';
import CarouselIndicator from '@/shared/ui/CarouselIndicator';
import Tag from '@/shared/ui/Tag';

import PlanCard from '@/entities/plan/ui/PlanCard';

import AiMessage from '@/features/chat/components/AiMessage';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import UserMessage from '@/features/chat/components/UserMessage';

export default function NotFoundPage() {
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
    <div>
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
      AI 어시스턴트 프로필
      <ChatAvatar></ChatAvatar>
      요금제 채팅 (components/chat에 AiMessage와 UserMessage를 적절하게 사용하면
      됨)
      <div className="w-100">
        <AiMessage
          content="요금제를 추천해드릴게요."
          createdAt={'2026-08-26T14:00:00+09:00'}
        />
        <UserMessage
          content="내 요금제 추천해줘."
          createdAt={'2026-08-26T14:00:00+09:00'}
        />
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
      태그
      <br />
      <Tag>추천1위 기본적으로 쓰이는 태그</Tag>
      <br />
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
