import type { ReactNode, RefObject } from 'react';

import { ChevronLeft } from 'lucide-react';

import StepProgress from '@/shared/ui/StepProgress';

import type { StepProgressPosition } from '@/features/join/lib/steps';

interface JoinCardFrameProps {
  cardRef: RefObject<HTMLDivElement | null>;
  /** 카드 머리에 적는 지금 단계 이름 */
  title: string;
  /** 진행 표시줄에 그릴 위치. null 이면 표시줄을 아예 안 그린다 */
  progressPosition: StepProgressPosition | null;
  /** "요금제 가입 진행 상황" 처럼 이 절차가 무엇인지 읽어주는 문구 */
  progressAriaLabel: string;
  isPrevDisabled: boolean;
  onPrev: () => void;
  children: ReactNode;
}

/**
 * CARD-029~032: 대화 안에 서는 가입 카드의 껍데기 - 이전 버튼, 단계 이름, 진행 표시줄.
 *
 * 종류(요금제·부가서비스)마다 안에 들어가는 단계 화면은 완전히 다르지만 이 테두리는
 * 같아서 여기 모아둔다. 안쪽 내용은 각 카드가 정한다.
 */
export default function JoinCardFrame({
  cardRef,
  title,
  progressPosition,
  progressAriaLabel,
  isPrevDisabled,
  onPrev,
  children,
}: JoinCardFrameProps) {
  // 폭·여백은 대화에 나란히 서는 PlanCard 와 같은 값으로 맞춘다.
  // scroll-mt 는 고정 헤더 높이만큼 - 없으면 단계 이동 때 카드 머리가 헤더에 가린다
  return (
    <div
      ref={cardRef}
      className="flex w-[80%] scroll-mt-(--height-header) flex-col rounded-md bg-background-default p-4"
    >
      <div className="flex items-center gap-1">
        {/*
          CARD-040: 첫 단계에서는 돌아갈 곳이 없어 잠가둔다. 처리 중이거나 이미
          가입을 마친 뒤에도 되돌릴 것이 없어 같이 잠근다.
          Header·QuestionCard 의 이전 버튼과 같은 방식으로 그린다
        */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isPrevDisabled}
          aria-label="이전 단계로 이동"
          className="shrink-0 cursor-pointer text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>

        <h3 className="text-14 font-medium text-text-primary">{title}</h3>
      </div>

      {/* 상세 확인은 절차가 시작되기 전이라 표시줄을 안 그린다 */}
      {progressPosition && (
        <div className="mt-3">
          <StepProgress
            total={progressPosition.total}
            currentIndex={progressPosition.currentIndex}
            ariaLabel={progressAriaLabel}
          />
        </div>
      )}

      {children}
    </div>
  );
}
