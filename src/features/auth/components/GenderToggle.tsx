'use client';

import { FIELD_HEIGHT_STYLES, type FieldSize } from '@/shared/ui/fieldSize';
import { cn } from '@/shared/utils/cn';
import type { Gender } from '@/features/auth/types';

interface GenderOption {
  value: Gender;
  label: string;
}

// DB에는 CHECK 제약에 맞춰 MALE/FEMALE로 저장하고, 화면에는 남/여로 표시
const GENDER_OPTIONS: GenderOption[] = [
  { value: 'MALE', label: '남' },
  { value: 'FEMALE', label: '여' },
];

// 높이·글자 크기는 옆 입력 칸과 같은 표를 쓰고, 가로 폭만 따로 정한다
const TOGGLE_WIDTH: Record<FieldSize, string> = {
  sm: 'w-9',
  md: 'w-11',
};

interface GenderToggleProps {
  /** 미선택은 빈 문자열 (선택 항목) */
  value: Gender | '';
  onChange: (value: Gender | '') => void;
  /** 나란히 놓이는 입력 칸과 같은 값을 줘야 높이가 맞는다 */
  size?: FieldSize;
}

export default function GenderToggle({
  value,
  onChange,
  size = 'md',
}: GenderToggleProps) {
  const handleClick = (gender: Gender) => {
    // 선택 항목이므로 같은 값을 다시 누르면 해제
    onChange(value === gender ? '' : gender);
  };

  return (
    <div
      role="group"
      aria-label="성별"
      className="flex shrink-0 overflow-hidden rounded-md border border-border-gray"
    >
      {GENDER_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            aria-pressed={isSelected}
            className={cn(
              FIELD_HEIGHT_STYLES[size],
              TOGGLE_WIDTH[size],
              'transition-colors hover:cursor-pointer',
              isSelected
                ? 'bg-primary-red text-neutral-pure-white'
                : 'bg-neutral-pure-white text-text-secondary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
