'use client';

import Image from 'next/image';

import { Pencil, Share2 } from 'lucide-react';

import Button from '@/shared/ui/Button';
import PlanCard from '@/entities/plan/ui/PlanCard';

import BenefitList from '@/features/test/components/BenefitList';
import SectionTitle from '@/features/test/components/SectionTitle';
import { useTestResult } from '@/features/test/hooks/useTestResult';

interface TestResultProps {
  /** 사용자를 부를 이름. auth 는 feature 라 여기서 직접 못 읽고 app 이 넘겨준다 */
  displayName: string;
}

/** TEST-007~012: 성향 검사 결과 화면 본문 */
export default function TestResult({ displayName }: TestResultProps) {
  const { hasAnswer, result, recommendedPlan, retryTest, shareResult } =
    useTestResult();

  // 응답이 없으면 훅이 채팅으로 되돌리는 중이므로 아무것도 그리지 않는다
  if (!hasAnswer) return null;

  return (
    <>
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
          <h1 className="text-20 font-bold text-background-default">
            {result.type.name}
          </h1>
          <p className="text-14 font-medium text-background-default">
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
          iconTone="yellow"
        />
        {recommendedPlan ? (
          <PlanCard plan={recommendedPlan} rank={1} appendClassName="w-full" />
        ) : (
          <p className="rounded-md bg-background-default p-4 text-12 text-text-secondary">
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
          iconTone="red"
        />
        <BenefitList benefits={result.type.benefits} />
      </section>

      {/* 공유 / 재응시 (TEST-011, TEST-012) */}
      <div className="flex gap-2">
        <Button
          variant="main"
          radius="full"
          size="lg"
          gap="md"
          onClick={shareResult}
          appendClassName="flex-1"
        >
          <Share2 size={16} aria-hidden />
          친구에게 공유하기
        </Button>
        <Button
          variant="outline"
          radius="full"
          size="lg"
          gap="md"
          onClick={retryTest}
          appendClassName="flex-1"
        >
          <Pencil size={16} aria-hidden />
          다시 테스트하기
        </Button>
      </div>
    </>
  );
}
