'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import CarouselIndicator from '@/shared/ui/CarouselIndicator';

import PlanCard from '@/entities/plan/ui/PlanCard';

import type { Plan } from '@/entities/plan/types';
import type { PlanRecommendation } from '@/features/chat/types';

import { cn } from '@/shared/utils/cn';

// PlanCard 가 가진 자기 폭. 인디케이터와 오른쪽 화살표를 카드 끝에 맞추는 데 쓴다
const CARD_WIDTH = 'w-[80%]';

// 스크롤이 멎었다고 보는 시간
const SCROLL_SETTLE_MS = 100;

/**
 * 프로그램으로 카드를 옮긴다.
 *
 * mandatory 스냅이 걸린 채로 smooth 스크롤을 걸면 브라우저가 이동 도중에 곧바로
 * 스냅 지점으로 붙여버려서, 스르륵 넘어가지 않고 툭 바뀐다. 그래서 옮기는 동안만
 * 스냅을 꺼둔다 - 멎은 뒤 restoreSnap 으로 되돌린다.
 */
function slideTo(element: HTMLDivElement, index: number): void {
  element.style.scrollSnapType = 'none';
  element.scrollTo({
    left: index * element.clientWidth,
    behavior: 'smooth',
  });
}

/** 손으로 미는 스와이프는 다시 스냅이 걸려야 한 장씩 딱 붙는다 */
function restoreSnap(element: HTMLDivElement): void {
  element.style.scrollSnapType = '';
}

interface PlanCardCarouselProps {
  recommendations: PlanRecommendation[];
  // 신청하기 - 누른 카드의 요금제를 그대로 넘긴다
  onJoin?: (plan: Plan) => void;
}

/**
 * 추천 요금제 카드를 한 장씩 넘겨 보는 캐러셀.
 * 칸 하나가 화면 폭을 통째로 차지해서 한 번에 한 장만 보인다.
 * 카드 폭·모양은 PlanCard 가 가진 값을 그대로 쓴다.
 */
export default function PlanCardCarousel({
  recommendations,
  onJoin,
}: PlanCardCarouselProps) {
  // 1. 상태 및 훅
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // 렌더와 무관하게 최신 위치를 읽어야 해서 ref 로도 들고 있는다
  const activeIndexRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 2. 부수 효과
  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // 3. 이벤트 핸들러
  const handleScroll = () => {
    const element = scrollAreaRef.current;
    if (!element) return;

    // 미는 도중에 되돌리면 화면이 덜컹거린다 - 멎은 뒤에 판단한다
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    settleTimerRef.current = setTimeout(() => {
      // 칸 하나가 화면 폭과 같으므로 나눈 몫이 곧 카드 번호가 된다
      const step = element.clientWidth;
      const landed = Math.round(element.scrollLeft / step);

      // 세게 밀어 여러 장을 지나쳤어도 바로 옆 카드에서 멈춘다
      const stepped = Math.min(
        Math.max(landed, activeIndexRef.current - 1),
        activeIndexRef.current + 1,
      );
      const nextIndex = Math.min(
        Math.max(stepped, 0),
        recommendations.length - 1,
      );

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      if (landed !== nextIndex) {
        // 되돌리는 이동도 스냅을 끈 채로 - 이 스크롤이 멎으면 여기로 다시 들어온다
        slideTo(element, nextIndex);
        return;
      }

      restoreSnap(element);
    }, SCROLL_SETTLE_MS);
  };

  /**
   * 화살표로 한 장 옮긴다. 스크롤만 시작하고 순번은 건드리지 않는다 -
   * 스와이프와 똑같이 스크롤이 멎은 뒤 handleScroll 이 정하게 두어야,
   * 카드가 미끄러지는 동안 인디케이터와 화살표가 먼저 바뀌지 않는다.
   */
  const handleStep = (delta: number) => {
    const element = scrollAreaRef.current;
    if (!element) return;

    const nextIndex = Math.min(
      Math.max(activeIndex + delta, 0),
      recommendations.length - 1,
    );

    slideTo(element, nextIndex);
  };

  // 인디케이터 점을 누르면 해당 순번의 카드로 스크롤한다.
  // 한 번에 여러 장을 건너뛸 수 있어서, 이쪽은 순번을 먼저 정해 둔다
  // (handleScroll 이 한 장씩만 움직이도록 잡아두기 때문).
  const handleSelectIndex = (index: number) => {
    const element = scrollAreaRef.current;
    if (!element) return;

    slideTo(element, index);
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  // 4. 렌더링
  const lastIndex = recommendations.length - 1;

  return (
    <div className="flex w-full flex-col gap-1">
      {/*
        카드는 원래 자리(말풍선 왼쪽 끝)와 원래 폭 그대로 두고, 화살표만 절대 위치로
        카드 양옆에 띄운다. 절대 위치라 칸 크기에 영향을 주지 않아 카드가 밀리지 않는다.
        왼쪽 화살표가 놓이는 자리는 아바타 아래의 빈 공간이다.
      */}
      <div className="relative w-full">
        {/* 가로 스크롤 + 스냅. 스크롤바는 가리고 스와이프만 남긴다 */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {recommendations.map((item) => (
            <div
              key={item.plan.id}
              className="flex w-full shrink-0 snap-start snap-always"
            >
              <PlanCard
                plan={item.plan}
                rank={item.rank}
                annualSavings={item.annualSavings}
                onJoin={onJoin ? () => onJoin(item.plan) : undefined}
              />
            </div>
          ))}
        </div>

        {/*
          첫 장에는 다음만, 마지막 장에는 이전만 보인다. 안 보이는 쪽도 자리는 그대로
          두어(invisible) 카드를 넘겨도 화살표 자리가 움직이지 않게 한다.
        */}
        {/* right-full: 칸 왼쪽 바깥(아바타 아래 빈 자리)에 세운다 */}
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={activeIndex === 0}
          aria-label="이전 요금제 보기"
          className={cn(
            'absolute top-1/2 right-full mr-1 -translate-y-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text-primary',
            activeIndex === 0 && 'invisible',
          )}
        >
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>

        {/* left-[80%]: 카드가 끝나는 자리 - CARD_WIDTH 와 같은 값이다 */}
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={activeIndex === lastIndex}
          aria-label="다음 요금제 보기"
          className={cn(
            'absolute top-1/2 left-[80%] ml-1 -translate-y-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text-primary',
            activeIndex === lastIndex && 'invisible',
          )}
        >
          <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      {/* 카드가 왼쪽에 붙어 있으므로, 카드와 같은 폭 안에서 가운데로 맞춘다 */}
      <div className={`flex ${CARD_WIDTH} justify-center`}>
        <CarouselIndicator
          total={recommendations.length}
          activeIndex={activeIndex}
          onSelect={handleSelectIndex}
        />
      </div>
    </div>
  );
}
