'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import CarouselIndicator from '@/shared/ui/CarouselIndicator';

import PlanCard from '@/entities/plan/ui/PlanCard';

import type { Plan } from '@/entities/plan/types';
import type { PlanRecommendation } from '@/features/chat/types';

// 스크롤이 멎었다고 보는 시간
const SCROLL_SETTLE_MS = 100;

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
        element.scrollTo({ left: nextIndex * step, behavior: 'smooth' });
      }
    }, SCROLL_SETTLE_MS);
  };

  // 인디케이터 점을 누르면 해당 순번의 카드로 스크롤한다.
  const handleSelectIndex = (index: number) => {
    const element = scrollAreaRef.current;
    if (!element) return;

    element.scrollTo({ left: index * element.clientWidth, behavior: 'smooth' });
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  // 4. 렌더링
  const lastIndex = recommendations.length - 1;

  return (
    <div className="flex w-full flex-col gap-1">
      {/*
        화살표를 카드 바깥에 두려고 카드를 칸 가운데로 옮겼다. PlanCard 는 자기 폭이
        80% 라 좌우에 10% 씩 빈 자리가 생기고, 화살표가 그 자리에 들어가 카드를
        가리지 않는다. 카드 폭은 그대로다.
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
              className="flex w-full shrink-0 snap-start snap-always justify-center"
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

        {/* 첫 장에는 다음만, 마지막 장에는 이전만 나온다 */}
        {activeIndex > 0 && (
          <button
            type="button"
            onClick={() => handleSelectIndex(activeIndex - 1)}
            aria-label="이전 요금제 보기"
            className="absolute top-1/2 left-0 -translate-y-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text-primary"
          >
            <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
          </button>
        )}

        {activeIndex < lastIndex && (
          <button
            type="button"
            onClick={() => handleSelectIndex(activeIndex + 1)}
            aria-label="다음 요금제 보기"
            className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text-primary"
          >
            <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
          </button>
        )}
      </div>

      {/* 카드가 칸 가운데에 있으므로 인디케이터도 전체 폭 기준으로 가운데 */}
      <div className="flex w-full justify-center">
        <CarouselIndicator
          total={recommendations.length}
          activeIndex={activeIndex}
          onSelect={handleSelectIndex}
        />
      </div>
    </div>
  );
}
