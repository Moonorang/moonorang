import { LogIn, Smartphone, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface HeaderIconItem {
  label: string;
  icon: LucideIcon;
  // 아이콘/링 색과 아래 설명 칩의 배경색 - accent-1~3(목록/아이콘 구분용 색)을
  // 그대로 하나씩 배정해서 세 아이콘을 구분한다
  textClassName: string;
  ringClassName: string;
  chipClassName: string;
}

// 실제 헤더(HEADER-003)와 같은 순서 - 마이페이지, 상품·혜택, 로그인
const ITEMS: HeaderIconItem[] = [
  {
    label: '마이페이지',
    icon: User,
    textClassName: 'text-accent-1',
    ringClassName: 'bg-accent-1',
    chipClassName: 'bg-accent-1-light',
  },
  {
    label: '상품·혜택',
    icon: Smartphone,
    textClassName: 'text-accent-2',
    ringClassName: 'bg-accent-2',
    chipClassName: 'bg-accent-2-light',
  },
  {
    label: '로그인',
    icon: LogIn,
    textClassName: 'text-accent-3',
    ringClassName: 'bg-accent-3',
    chipClassName: 'bg-accent-3/15',
  },
];

/** 두 번째 단계 - 헤더 모양을 흉내 낸 카드 위에서 아이콘 3개를 하나씩 짚어준다 */
export default function HeaderIconsVisual() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-background-default p-4 shadow-default">
      {/* 실제 헤더와 같은 높이(--height-header)로 - 아이콘 세 개만 있으면
          카드 안에서 너무 낮고 옹색해 보여서, 실제 헤더 바 비율을 그대로 맞춘다 */}
      <div className="flex h-(--height-header) items-center justify-between border-b border-border-light">
        <span className="font-display text-16 leading-none tracking-tight">
          <span className="text-action-secondary">
            <span className="text-18">M</span>oono
          </span>
          <span className="text-action-primary">rang</span>
        </span>

        <div className="flex items-center gap-3">
          {ITEMS.map(({ label, icon: Icon, textClassName, ringClassName }) => (
            <div
              key={label}
              className="relative flex h-6 w-6 items-center justify-center"
            >
              {/* 여기를 보라는 신호 - 은은하게 번지는 링 */}
              <span
                className={cn(
                  'absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping',
                  ringClassName,
                )}
                aria-hidden
              />
              <Icon
                size={18}
                strokeWidth={1.5}
                className={cn('relative', textClassName)}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>

      {/* 각 아이콘이 뭔지 색으로 짝지어 설명 */}
      <ul className="flex flex-col gap-2">
        {ITEMS.map(({ label, icon: Icon, textClassName, chipClassName }) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                chipClassName,
              )}
            >
              <Icon
                size={14}
                strokeWidth={2}
                className={textClassName}
                aria-hidden
              />
            </span>
            <span className="text-12 font-medium text-text-primary">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
