'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import CarouselIndicator from '@/shared/ui/CarouselIndicator';

import PlanCard from '@/entities/plan/ui/PlanCard';
import PlanDetailModal from '@/entities/plan/ui/PlanDetailModal';

import type { Plan } from '@/entities/plan/types';
import type { PlanRecommendation } from '@/features/chat/types';

import { cn } from '@/shared/utils/cn';

// PlanCard 가 가진 자기 폭. 인디케이터와 오른쪽 화살표를 카드 끝에 맞추는 데 쓴다.
// PlanCard.tsx의 w-[min(80%,400px)]와 반드시 같은 값이어야 한다.
const CARD_WIDTH = 'w-[min(80%,440px)]';

/**
 * 카드 사이 간격(px). Tailwind 의 gap-4 와 같은 값이어야 한다.
 *
 * 칸 하나가 화면 폭을 통째로 차지해도, 카드에 달린 그림자(shadow-default)는
 * 제 칸 밖으로 번진다. 간격이 0이면 다음 카드 왼쪽 그림자가 화면 오른쪽 끝에
 * 옅게 비쳐서 카드가 살짝 보이는 것처럼 된다. 그림자 번짐(10px)보다 넓게 띄운다.
 */
const SLIDE_GAP_PX = 16;

// 스크롤이 멎었다고 보는 시간
const SCROLL_SETTLE_MS = 100;

/** 화살표·인디케이터로 한 장 옮기는 데 걸리는 시간 */
const SLIDE_DURATION_MS = 320;

/** 손을 뗀 스와이프처럼 끝에서 감속한다 */
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * 카드 한 장을 넘길 때 움직이는 거리 - 칸 하나 폭에 사이 간격을 더한 값이다.
 * 스냅 지점도 이 간격만큼 밀리므로, 위치 계산은 전부 이 값을 기준으로 해야 한다.
 */
function getSlideStep(element: HTMLDivElement): number {
  return element.clientWidth + SLIDE_GAP_PX;
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
  // CARD-019 '요금제 상세 보기' - 열려 있는 상세. null 이면 닫힌 상태
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // 렌더와 무관하게 최신 위치를 읽어야 해서 ref 로도 들고 있다 - 지금 화면에
  // 표시 중인 순번이라, 미는 동안 실시간으로 따라 움직인다
  const activeIndexRef = useRef(0);
  /*
    한 판(스와이프 한 번)이 시작된 자리. 표시용 순번과 따로 두는 이유는, 아래에서
    "세게 밀어도 옆 카드까지만" 잡아둘 때의 기준이 되기 때문이다 - 표시용은 미는
    동안 계속 바뀌므로 그걸 기준 삼으면 여러 장을 그대로 지나쳐버린다.
  */
  const settledIndexRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideFrameRef = useRef<number | null>(null);

  // 2. 부수 효과
  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (slideFrameRef.current) cancelAnimationFrame(slideFrameRef.current);
    };
  }, []);

  // 3. 이벤트 핸들러
  const cancelSlide = () => {
    if (!slideFrameRef.current) return;

    cancelAnimationFrame(slideFrameRef.current);
    slideFrameRef.current = null;
  };

  /**
   * 프로그램으로 카드를 옮긴다.
   *
   * scrollTo 의 behavior: 'smooth' 를 쓰지 않고 프레임마다 scrollLeft 를 직접
   * 움직인다. mandatory 스냅이 걸려 있으면 브라우저가 이동 도중에 곧바로 스냅
   * 지점으로 붙여 애니메이션을 씹고, 기기의 "동작 줄이기" 설정도 smooth 를
   * 무시하기 때문이다. 이렇게 하면 어느 환경에서든 스와이프처럼 미끄러진다.
   *
   * 옮기는 동안은 스냅을 꺼둔다 - 켜져 있으면 매 프레임 스냅 지점으로 끌려간다.
   * 다시 켜는 건 스크롤이 멎은 뒤 handleScroll 이 맡는다.
   */
  const slideTo = (index: number) => {
    const element = scrollAreaRef.current;
    if (!element) return;

    cancelSlide();

    const startLeft = element.scrollLeft;
    const distance = index * getSlideStep(element) - startLeft;

    if (distance === 0) return;

    element.style.scrollSnapType = 'none';

    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / SLIDE_DURATION_MS, 1);

      element.scrollLeft = startLeft + distance * easeOutCubic(progress);

      if (progress < 1) {
        slideFrameRef.current = requestAnimationFrame(step);
        return;
      }

      slideFrameRef.current = null;
    };

    slideFrameRef.current = requestAnimationFrame(step);
  };

  const handleScroll = () => {
    const element = scrollAreaRef.current;
    if (!element) return;

    // 칸 하나가 화면 폭 + 사이 간격이므로, 나눈 몫이 곧 카드 번호가 된다
    const step = getSlideStep(element);
    const lastIndex = recommendations.length - 1;

    /*
      인디케이터는 미는 즉시 따라온다 - 멎을 때까지 기다리면 손을 뗀 뒤에야 점이
      옮겨가서 반 박자 늦게 보인다. 반쯤 넘어간 시점(round)에 바뀌므로, 밀다가
      되돌리면 점도 같이 되돌아온다.

      어디에 설지 "판정"하는 것은 여전히 아래 멎은 뒤에 한다 - 이건 화면 표시일 뿐이다.
    */
    const showing = Math.min(
      Math.max(Math.round(element.scrollLeft / step), 0),
      lastIndex,
    );

    if (showing !== activeIndexRef.current) {
      activeIndexRef.current = showing;
      setActiveIndex(showing);
    }

    // 미는 도중에 되돌리면 화면이 덜컹거린다 - 멎은 뒤에 판단한다
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    settleTimerRef.current = setTimeout(() => {
      const landed = Math.round(element.scrollLeft / step);

      // 세게 밀어 여러 장을 지나쳤어도 바로 옆 카드에서 멈춘다 - 기준은 표시용이
      // 아니라 이번 판이 시작된 자리다
      const stepped = Math.min(
        Math.max(landed, settledIndexRef.current - 1),
        settledIndexRef.current + 1,
      );
      const nextIndex = Math.min(Math.max(stepped, 0), lastIndex);

      settledIndexRef.current = nextIndex;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      if (landed !== nextIndex) {
        // 되돌리는 이동도 스냅을 끈 채로 - 이 스크롤이 멎으면 여기로 다시 들어온다
        slideTo(nextIndex);
        return;
      }

      restoreSnap(element);
    }, SCROLL_SETTLE_MS);
  };

  /**
   * 화살표로 한 장 옮긴다. 스크롤만 시작하고 순번은 건드리지 않는다 -
   * 스와이프와 똑같이 handleScroll 이 정하게 두어야 두 경로가 같은 규칙으로 움직인다.
   * (미끄러지는 동안 인디케이터는 handleScroll 이 실시간으로 따라 옮겨준다)
   */
  const handleStep = (delta: number) => {
    const nextIndex = Math.min(
      Math.max(activeIndex + delta, 0),
      recommendations.length - 1,
    );

    slideTo(nextIndex);
  };

  // 인디케이터 점을 누르면 해당 순번의 카드로 스크롤한다.
  // 한 번에 여러 장을 건너뛸 수 있어서, 이쪽은 순번을 먼저 정해 둔다
  // (handleScroll 이 한 장씩만 움직이도록 잡아두기 때문).
  const handleSelectIndex = (index: number) => {
    slideTo(index);
    settledIndexRef.current = index;
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
          onPointerDown={cancelSlide}
          className="flex w-full snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
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
                onViewDetail={() => setSelectedPlan(item.plan)}
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

        {/* left-[min(80%,400px)]: 카드가 끝나는 자리 - CARD_WIDTH 와 같은 값이다 */}
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={activeIndex === lastIndex}
          aria-label="다음 요금제 보기"
          className={cn(
            'absolute top-1/2 left-[min(80%,440px)] ml-1 -translate-y-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text-primary',
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

      {/* DATA-003: 상세보기를 누르면 목록에서와 같은 상세가 화면을 덮으며 들어온다 */}
      <PlanDetailModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onJoin={(plan) => {
          // 가입 카드는 대화 맨 끝에 붙으므로, 화면을 덮고 있는 상세를 먼저 걷어낸다
          setSelectedPlan(null);
          onJoin?.(plan);
        }}
      />
    </div>
  );
}
