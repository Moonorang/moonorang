'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { MonitorPlay, Pencil, Share2, ShieldCheck, Wifi } from 'lucide-react';

import { Header, PlanCard, Button } from '@/components';

import { useAuth } from '@/hooks/useAuth';
import { useTestStore } from '@/stores/testStore';
import { diagnosePlanType, pickRecommendedPlan } from '@/lib/diagnosePlanType';
import { cn } from '@/utils/cn';
import type { Plan } from '@/types/plan';
import type { BenefitIcon } from '@/types/test';

// 혜택 아이콘 종류별 아이콘과 배경색
// #FFEAAD 는 globals.css 에 없어 가장 가까운 secondary-light-yellow 로 대체함
const BENEFIT_STYLES: Record<
  BenefitIcon,
  { icon: typeof Wifi; className: string }
> = {
  monitor: {
    icon: MonitorPlay,
    className: 'bg-secondary-light-yellow text-primary-yellow',
  },
  wifi: {
    icon: Wifi,
    className: 'bg-secondary-light-green text-primary-green',
  },
  shield: {
    icon: ShieldCheck,
    className: 'bg-secondary-light-blue text-secondary-blue',
  },
};

function SectionTitle({
  title,
  iconSrc,
  iconWidth,
  iconHeight,
  className,
}: {
  title: string;
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-md',
          className,
        )}
      >
        <Image src={iconSrc} alt="" width={iconWidth} height={iconHeight} />
      </div>
      <h2 className="text-12 font-medium text-text-main">{title}</h2>
    </div>
  );
}

export default function TestResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { answers, resetTest } = useTestStore();

  const [plans, setPlans] = useState<Plan[]>([]);

  // TEST-006: 순수 함수라 같은 응답이면 항상 같은 유형이 나온다.
  const result = useMemo(() => diagnosePlanType(answers), [answers]);

  const hasAnswer = answers.some((answer) => answer !== null);

  useEffect(() => {
    // 응답 없이 직접 들어온 경우(새로고침 등)는 채팅으로 돌려보낸다.
    if (!hasAnswer) {
      router.replace('/');
      return;
    }

    fetch('/api/plans')
      .then((response) => response.json())
      .then((data) => setPlans(data.plans ?? []))
      .catch(() => setPlans([]));
  }, [hasAnswer, router]);

  const recommendedPlan = pickRecommendedPlan(plans, result.budgetScore);

  // TEST-009: 비회원도 이용 가능하므로 이름이 없으면 "회원"으로 부른다.
  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.nickname as string | undefined) ??
    '회원';

  const handleRetry = () => {
    resetTest();
    router.push('/');
  };

  const handleShare = () => {
    // TEST-012: 공유 API 를 못 쓰는 브라우저에서는 링크 복사로 대신한다.
    if (navigator.share) {
      void navigator.share({
        title: '무너랑 요금제 성향 검사',
        text: `내 요금제 성향은 "${result.type.name}"!`,
        url: window.location.href,
      });
      return;
    }
    void navigator.clipboard.writeText(window.location.href);
  };

  if (!hasAnswer) return null;

  return (
    <div className="min-h-dvh bg-neutral-off-white">
      <Header />

      <div className="flex flex-col gap-5 px-4 pt-(--height-header) pb-5">
        {/* 유형 히어로 (TEST-007) */}
        <div className="mt-5 flex flex-col items-center gap-4 rounded-md bg-linear-to-br from-gradient-from to-gradient-to p-6">
          <Image
            src={result.type.imageSrc}
            alt=""
            width={155}
            height={115}
            className="h-auto max-w-full"
            priority
          />
          <div className="flex w-full flex-col gap-2">
            <h1 className="text-20 font-bold text-neutral-pure-white">
              {result.type.name}
            </h1>
            <p className="text-14 font-medium text-neutral-pure-white">
              {result.type.description}
            </p>
          </div>
        </div>

        {/* 추천 요금제 (TEST-007, TEST-008) */}
        <section className="flex flex-col gap-2">
          <SectionTitle
            title={`${displayName}님을 위한 추천 요금제`}
            iconSrc="/images/test/icon-plan.png"
            iconWidth={25}
            iconHeight={28}
            className="bg-secondary-light-yellow"
          />
          {recommendedPlan ? (
            <PlanCard plan={recommendedPlan} rank={1} className="w-full" />
          ) : (
            <p className="rounded-md bg-neutral-pure-white p-4 text-12 text-text-secondary">
              추천 요금제를 불러오는 중이에요.
            </p>
          )}
        </section>

        {/* 맞춤 혜택 */}
        <section className="flex flex-col gap-2">
          <SectionTitle
            title="맞춤 혜택"
            iconSrc="/images/test/icon-benefit.png"
            iconWidth={30}
            iconHeight={27}
            className="bg-secondary-light-red"
          />
          {result.type.benefits.map((benefit) => {
            const { icon: Icon, className } = BENEFIT_STYLES[benefit.icon];

            return (
              <div
                key={benefit.title}
                className="flex items-center gap-2 rounded-md bg-neutral-pure-white p-4"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
                    className,
                  )}
                >
                  <Icon size={16} aria-hidden />
                </span>
                <div className="flex flex-col">
                  <p className="text-12 font-medium text-text-main">
                    {benefit.title}
                  </p>
                  <p className="text-10 font-medium text-text-secondary">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* 공유 / 재응시 (TEST-011, TEST-012) */}
        <div className="flex gap-2">
          <Button
            variant="main"
            radius="full"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 py-2.5 text-12 font-medium"
          >
            <Share2 size={16} aria-hidden />
            친구에게 공유하기
          </Button>
          <Button
            variant="outline"
            radius="full"
            onClick={handleRetry}
            className="flex flex-1 items-center justify-center gap-2 py-2.5 text-12 font-medium text-text-secondary"
          >
            <Pencil size={16} aria-hidden />
            다시 테스트하기
          </Button>
        </div>
      </div>
    </div>
  );
}
