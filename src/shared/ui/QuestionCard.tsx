import type { ReactNode } from 'react';
import Image from 'next/image';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

export interface QuestionOption {
  /** 선택지 식별값. 점수·예산 등 의미는 호출부가 정한다 */
  value: number;
  label: string;
}

interface QuestionCardProps {
  /** 헤더 문구 - 성향 검사와 조건 수집이 서로 다른 문구를 쓴다 */
  title: string;
  imageSrc: string;
  question: string;
  options: QuestionOption[];
  currentIndex: number;
  total: number;
  selectedValue: number | null;
  onSelect: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  children?: ReactNode;
  hideSkip?: boolean;
}

export default function QuestionCard({
  title,
  imageSrc,
  question,
  options,
  currentIndex,
  total,
  selectedValue,
  onSelect,
  onPrev,
  onNext,
  onSkip,
  onClose,
  children,
  hideSkip = false,
}: QuestionCardProps) {
  // TEST-004 / CARD-010: 현재 문항 기준 진행률
  const progressPercent = ((currentIndex + 1) / total) * 100;

  return (
    <div className="flex w-full flex-col gap-5 rounded-md bg-background-default p-4 shadow-default">
      {/* 헤더 + 진행률 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Image src={imageSrc} alt="" width={30} height={35} />
          <span className="text-text-main text-12">{title}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border-default">
          <div
            className="h-full rounded-full bg-action-secondary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* 질문 + 문항 이동 + 닫기 (CARD-010, CARD-011) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-14 font-medium text-text-primary">
            {question}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex === 0}
                aria-label="이전 문항"
                className="cursor-pointer text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} aria-hidden />
              </button>
              <span className="text-12 whitespace-nowrap text-text-secondary">
                {total}개 중 {currentIndex + 1}개
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex === total - 1}
                aria-label="다음 문항"
                className="cursor-pointer text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="질문 카드 닫기"
              className="cursor-pointer text-text-secondary"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* 선택지 목록 */}
        <div className="flex flex-col gap-1.5">
          {options.map((option, index) => {
            const isSelected = selectedValue === option.value;

            return (
              <div key={option.value} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelect(option.value)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 px-1 text-left',
                    isSelected &&
                      'rounded-sm bg-action-secondary-light p-1 px-1',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-10',
                      isSelected
                        ? 'bg-action-secondary text-background-default'
                        : 'bg-border-default text-text-primary',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-12 text-text-primary">
                    {option.label}
                  </span>
                </button>
                <div className="h-px w-full bg-border-default" />
              </div>
            );
          })}

          {/* 기타(직접 입력) 등 호출부가 덧붙이는 영역 (CARD-011) - 선택지와 같은 줄 모양 */}
          {children}

          {/* 건너뛰기 (CARD-011) - hideSkip이면 children 쪽에서 직접 그린다 */}
          {!hideSkip && (
            <div className="flex h-6 items-center justify-end px-1">
              <Button variant="outline" radius="sm" size="sm" onClick={onSkip}>
                건너뛰기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
