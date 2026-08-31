'use client';

import { useRef, useState } from 'react';

import CarouselIndicator from '@/shared/ui/CarouselIndicator';

import PlanCard from '@/entities/plan/ui/PlanCard';
import type { Plan } from '@/entities/plan/types';

export interface PlanCarouselItem {
  plan: Plan;
  rank?: number;
  annualSavings?: number;
}

interface PlanCarouselProps {
  items: PlanCarouselItem[];
  onViewDetail?: (planId: number) => void;
  onJoin?: (planId: number) => void;
}

/**
 * CARD-016~018: 추천 요금제가 여러 개면 가로 스와이프 캐러셀 + 인디케이터로 보여준다.
 * 하나뿐이면 캐러셀 UI 없이 카드 하나만 그린다(CarouselIndicator 자체도 total<=1이면 숨는다).
 */
export default function PlanCarousel({
  items,
  onViewDetail,
  onJoin,
}: PlanCarouselProps) {
  // 1. 상태 및 훅
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. 이벤트 핸들러
  // 스크롤 위치를 슬라이드 폭으로 나눠 가장 가까운 카드를 활성 인디케이터로 삼는다
  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element || items.length === 0) return;

    const slideWidth = element.scrollWidth / items.length;
    const index = Math.round(element.scrollLeft / slideWidth);

    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
  };

  // 인디케이터 점을 누르면 해당 순번의 카드로 스크롤한다.
  // handleScroll과 같은 근사식(scrollWidth/개수)을 써야 계산이 서로 안 어긋난다.
  const handleSelectIndex = (index: number) => {
    const element = scrollRef.current;
    if (!element) return;

    const slideWidth = element.scrollWidth / items.length;
    element.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
    setActiveIndex(index);
  };

  // 3. 렌더링
  if (items.length <= 1) {
    const only = items[0];
    if (!only) return null;

    return (
      <PlanCard
        plan={only.plan}
        rank={only.rank}
        annualSavings={only.annualSavings}
        onViewDetail={() => onViewDetail?.(only.plan.id)}
        onJoin={() => onJoin?.(only.plan.id)}
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto"
      >
        {items.map((item) => (
          <div key={item.plan.id} className="w-[85%] shrink-0 snap-center">
            <PlanCard
              plan={item.plan}
              rank={item.rank}
              annualSavings={item.annualSavings}
              appendClassName="w-full"
              onViewDetail={() => onViewDetail?.(item.plan.id)}
              onJoin={() => onJoin?.(item.plan.id)}
            />
          </div>
        ))}
      </div>

      <CarouselIndicator
        total={items.length}
        activeIndex={activeIndex}
        onSelect={handleSelectIndex}
      />
    </div>
  );
}
