'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  diagnosePlanType,
  pickRecommendedPlan,
} from '@/features/test/lib/diagnose';
import { useTestStore } from '@/features/test/store/testStore';
import type { Plan } from '@/entities/plan/types';

/**
 * 결과 화면이 필요로 하는 값과 동작을 한곳에서 만든다.
 * 응답 없이 직접 들어온 경우의 되돌리기까지 여기서 처리하고,
 * ui 는 hasAnswer 만 보고 그릴지 말지 정한다.
 */
export function useTestResult() {
  const router = useRouter();
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

  const retryTest = () => {
    resetTest();
    router.push('/');
  };

  const shareResult = () => {
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

  return {
    hasAnswer,
    result,
    recommendedPlan: pickRecommendedPlan(plans, result.budgetScore),
    retryTest,
    shareResult,
  };
}
