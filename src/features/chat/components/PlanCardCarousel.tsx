'use client';

import { useEffect, useRef, useState } from 'react';

import CarouselIndicator from '@/shared/ui/CarouselIndicator';

import PlanCard from '@/entities/plan/ui/PlanCard';

import type { PlanRecommendation } from '@/features/chat/types';

// PlanCard 가 가진 자기 폭. 인디케이터를 카드 가운데에 맞추는 데 쓴다
const CARD_WIDTH = 'w-[80%]';

// 스크롤이 멎었다고 보는 시간
const SCROLL_SETTLE_MS = 100;

interface PlanCardCarouselProps {
  recommendations: PlanRecommendation[];
}

/**
 * 추천 요금제 카드를 한 장씩 넘겨 보는 캐러셀.
 * 칸 하나가 화면 폭을 통째로 차지해서 한 번에 한 장만 보인다.
 * 카드 폭·모양은 PlanCard 가 가진 값을 그대로 쓴다.
 */
export default function PlanCardCarousel({
  recommendations,
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

  // 4. 렌더링
  return (
    <div className="flex w-full flex-col gap-1">
      {/* 가로 스크롤 + 스냅. 스크롤바는 가리고 스와이프만 남긴다 */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            />
          </div>
        ))}
      </div>

      {/* 카드가 왼쪽에 붙어 있으므로, 카드와 같은 폭 안에서 가운데로 맞춘다 */}
      <div className={`flex ${CARD_WIDTH} justify-center`}>
        <CarouselIndicator
          total={recommendations.length}
          activeIndex={activeIndex}
        />
      </div>
    </div>
  );
}
