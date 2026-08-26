'use client';

import { LogIn, Send, Plus, Mic, Search } from 'lucide-react';
import {
  AiMessage,
  Button,
  CarouselIndicator,
  ChatAvatar,
  Tag,
  UserMessage,
} from '@/components';

export default function NotFound() {
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
      버튼 목록
      <br />
      <Button variant="main" radius="md">
        버튼
      </Button>
      <Button variant="secondary" radius="md">
        버튼
      </Button>
      <Button variant="outline" radius="md">
        버튼
      </Button>
      <Button variant="ghost" radius="md">
        버튼
      </Button>
      <Button variant="answer" radius="full">
        버튼
      </Button>
      <Button variant="filter" radius="full">
        버튼
      </Button>
      <Button variant="gradient" radius="md" className="min-w-100">
        버튼
      </Button>
      <br />
      인디케이터
      <CarouselIndicator total={3} activeIndex={2} />
      태그
      <br />
      <Tag>추천1위 기본적으로 쓰이는 태그</Tag>
    </div>
  );
}
