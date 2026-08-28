'use client';

import Image from 'next/image';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';
import type { TestQuestion } from '@/types/test';

interface QuestionCardProps {
  // 헤더 문구 - 성향검사와 조건수집이 서로 다른 문구를 쓴다
  title: string;
  imageSrc: string;
  question: TestQuestion;
  currentIndex: number;
  total: number;
  selectedScore: number | null;
  onSelect: (score: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * CARD-008~011: 대화 안에 카드로 뜨는 선택형 질문 카드.
 * 성향 검사(TEST)와 추천 조건 수집이 같은 디자인을 쓰므로 한 컴포넌트로 둔다.
 */
export default function QuestionCard({
  title,
  imageSrc,
  question,
  currentIndex,
  total,
  selectedScore,
  onSelect,
  onPrev,
  onNext,
  onSkip,
  onClose,
  className,
}: QuestionCardProps) {
  // TEST-004: 현재 문항 기준 진행률
  const progressPercent = ((currentIndex + 1) / total) * 100;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-5 rounded-md bg-neutral-pure-white p-4 shadow-default',
        className,
      )}
    >
      {/* 헤더 + 진행률 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Image src={imageSrc} alt="" width={30} height={35} />
          <span className="text-10 font-medium text-primary-yellow">
            {title}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-text-gray">
          <div
            className="h-full rounded-full bg-primary-yellow transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* 질문 + 문항 이동 + 닫기 (CARD-010, CARD-011) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-12 text-text-main">{question.question}</span>
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
              <span className="text-10 whitespace-nowrap text-text-secondary">
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
              aria-label="검사 닫기"
              className="cursor-pointer text-text-secondary"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* 선택지 목록 */}
        <div className="flex flex-col gap-1.5">
          {question.options.map((option, index) => {
            const isSelected = selectedScore === option.score;

            return (
              <div key={option.score} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelect(option.score)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 px-1 text-left',
                    isSelected &&
                      'rounded-sm bg-secondary-light-yellow p-1 px-1',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-10',
                      isSelected
                        ? 'bg-primary-yellow text-neutral-pure-white'
                        : 'bg-text-gray text-text-main',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-10 text-text-main">{option.label}</span>
                </button>
                <div className="h-px w-full bg-text-gray" />
              </div>
            );
          })}

          {/* 건너뛰기 (CARD-011) */}
          <div className="flex h-6 items-center justify-end px-1">
            <Button
              variant="outline"
              radius="sm"
              onClick={onSkip}
              className="px-2 py-1"
            >
              건너뛰기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
