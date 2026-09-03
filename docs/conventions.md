# 코드 컨벤션

## 1. 네이밍 규칙 (Naming Convention)

- **컴포넌트 및 파일명**: `PascalCase` 사용 (예: `RecommendCard.tsx`, `ChatBubble.tsx`)
- **함수 및 변수명**: `camelCase` 사용 (예: `getUserData`, `isLoggedIn`)
- **상수(Constants)**: `UPPER_SNAKE_CASE` 사용 (예: `MAX_TIMEOUT_MS = 60000`)
- **Boolean 변수**: 반드시 `is`, `has`, `should`로 시작 (예: `isLoading`, `hasError`)
- **이벤트 핸들러**: `handle` + `이동/동작` (예: `handleLoginClick`, `handleFormSubmit`)
- **Props 인터페이스**: `컴포넌트명 + Props` (예: `RecommendCardProps`)

## 2. 파일 및 폴더 구조 (Feature-based)

관련된 파일끼리 묶어서 응집도를 높인다.

```
src/
 ┣ app/                 # Next.js App Router 페이지
 ┣ components/
 ┃ ┣ common/            # Header, Button, Modal 등 공통 UI
 ┃ ┣ chat/              # ChatBubble, ChatInput 등 챗봇 전용
 ┃ ┗ cards/             # RecommendCard, JoinFormCard 등 카드 UI
 ┣ hooks/               # 커스텀 훅 (ex. useChat, useAuth)
 ┣ store/               # 전역 상태 (Zustand 등)
 ┣ types/               # 공통 TypeScript 타입 (ex. user.ts, plan.ts)
 ┗ utils/               # 날짜 포맷팅, 유효성 검사 등 순수 함수
```

## 3. 컴포넌트 작성 순서 (Import & Structure)

**Import 순서:**

1. React / Next.js 내장 모듈
2. 외부 라이브러리 (Zustand, Supabase 등)
3. 내부 컴포넌트 (절대 경로 `@/components/...` 사용)
4. Hooks / Utils / Types / Constants
5. 이미지 / 스타일

**컴포넌트 구조 예시:**

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@supabase/supabase-js';

import Button from '@/components/common/Button';

import { useAuth } from '@/hooks/useAuth';
import type { PlanProps } from '@/types/plan';

interface RecommendCardProps {
  planData: PlanProps;
  onJoin: () => void;
}

export default function RecommendCard({ planData, onJoin }: RecommendCardProps) {
  // 1. 상태 (State) 및 훅 (Hooks)
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // 2. 부수 효과 (useEffect)
  useEffect(() => {
    // 로직
  }, []);

  // 3. 이벤트 핸들러 (Functions)
  const handleCardClick = () => {
    // 로직
  };

  // 4. 렌더링 (Return)
  return (
    <div className="flex flex-col p-4 bg-white rounded-lg">
      <h3 className="text-lg font-bold">{planData.name}</h3>
      <Button onClick={onJoin}>가입하기</Button>
    </div>
  );
}
```

## 4. 스타일링 (Tailwind CSS) 클래스 정렬 순서

Tailwind 클래스를 뒤죽박죽 적지 않고, **바깥에서 안쪽으로** 작성한다. (Prettier의 `prettier-plugin-tailwindcss` 플러그인 설치 강력 권장)

- **순서**: `레이아웃(flex, grid)` ➔ `위치(absolute)` ➔ `크기(w, h)` ➔ `여백(m, p)` ➔ `디자인(bg, border, rounded)` ➔ `텍스트(text-sm, font-bold)`
- **예시**: `className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-md text-gray-900 font-bold"`

## 5. TypeScript 규칙

- `any` 타입 사용을 엄격히 금지한다. 모를 때는 차라리 `unknown`을 사용한다.
- 객체 타입은 `interface`로 선언하고, Union이나 복잡한 타입은 `type`으로 선언한다.
- API 응답 값은 반드시 `types/` 폴더에 정의된 타입을 사용하여 타입 안정성을 보장한다.
