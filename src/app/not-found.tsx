'use client';

import Link from 'next/link';
// 팀원 가이드 1: lucide-react에서 사용할 아이콘을 이름으로 가져옵니다.
import {
  LogIn,
  Send,
  Plus,
  Mic,
  AlertCircle,
  Home,
  Search,
} from 'lucide-react';
import { ChatAvatar } from '@/components';

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

      <div>만든 컴포넌트 목록</div>
      <ChatAvatar></ChatAvatar>
    </div>
  );
}
