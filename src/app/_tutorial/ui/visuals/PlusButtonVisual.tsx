import Image from 'next/image';

import { Plus } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface PlusFeatureItem {
  label: string;
  iconSrc: string;
  chipClassName: string;
  textClassName: string;
}

// 실제 PlusMenu와 같은 순서·같은 아이콘 이미지를 그대로 재사용한다
const ITEMS: PlusFeatureItem[] = [
  {
    label: '대화 초기화',
    iconSrc: '/images/chat/icon-reset.png',
    chipClassName: 'bg-action-secondary-light',
    textClassName: 'text-action-secondary',
  },
  {
    label: '취미 성향 검사',
    iconSrc: '/images/chat/icon-plan-test.png',
    chipClassName: 'bg-accent-2-light',
    textClassName: 'text-accent-2',
  },
  {
    // PlusMenu의 실제 항목명은 '상담 결과 PDF 출력'이지만, 튜토리얼에서는
    // 같은 아이콘으로 '내 키워드 알아보기'를 소개한다
    label: '내 키워드 알아보기',
    iconSrc: '/images/chat/icon-pdf-export.png',
    chipClassName: 'bg-action-primary-light',
    textClassName: 'text-action-primary',
  },
];

/** 세 번째 단계 - 채팅 입력창을 흉내 내고, + 버튼을 누르면 뭐가 나오는지 미리 보여준다 */
export default function PlusButtonVisual() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-background-default p-4 shadow-default">
      {/* 실제 입력창처럼 + 버튼 + 입력 칸이 한 줄에 */}
      <div className="flex items-center gap-2">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-sm">
          <span
            className="absolute inset-0 rounded-sm bg-action-secondary opacity-40 motion-safe:animate-ping"
            aria-hidden
          />
          <Plus
            size={20}
            className="relative text-action-secondary"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-background-subtle px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-14 text-text-secondary">
            무너에게 무엇이든 물어보세요!
          </span>
        </div>
      </div>

      {/* + 버튼을 누르면 나오는 세 가지 기능 */}
      <ul className="flex flex-col gap-2">
        {ITEMS.map(({ label, iconSrc, chipClassName, textClassName }) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
                chipClassName,
                textClassName,
              )}
            >
              <Image src={iconSrc} alt="" width={16} height={16} />
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
