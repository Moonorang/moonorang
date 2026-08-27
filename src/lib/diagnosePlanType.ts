import { TEST_QUESTIONS } from '@/data/testQuestions';
import { PLAN_TYPES } from '@/data/testTypes';
import type { TestResult } from '@/types/test';

/**
 * TEST-006: 응답을 성향 유형으로 판정한다.
 *
 * 외부 입출력이 전혀 없는 순수 함수라, 같은 응답이면 언제나 같은 결과가 나온다.
 * answers 는 TEST_QUESTIONS 와 같은 순서의 선택지 score 배열이다.
 * 건너뛴 문항(null)은 최저 점수로 계산한다.
 */
export function diagnosePlanType(answers: (number | null)[]): TestResult {
  let typeScore = 0;
  let budgetScore = 1;

  TEST_QUESTIONS.forEach((question, index) => {
    const score = answers[index] ?? 1;

    if (question.countsTowardType) {
      typeScore += score;
    } else {
      budgetScore = score;
    }
  });

  // 구간이 4~16 을 빈틈없이 덮지만, 방어적으로 마지막 유형을 fallback 으로 둔다.
  const type =
    PLAN_TYPES.find(
      (candidate) =>
        typeScore >= candidate.minScore && typeScore <= candidate.maxScore,
    ) ?? PLAN_TYPES[PLAN_TYPES.length - 1];

  return { type, typeScore, budgetScore };
}

// 예산 문항(1~4) 이 뜻하는 월 요금 상한 (원)
const BUDGET_CEILINGS = [40_000, 60_000, 80_000, Number.POSITIVE_INFINITY];

/**
 * CARD-001: 요금제 선별은 모델이 아니라 보유 데이터 연산으로 한다.
 * 예산 상한 안에서 가장 혜택이 큰(= 가장 비싼) 요금제를 고르고,
 * 상한 안에 아무것도 없으면 가장 저렴한 요금제로 물러선다.
 */
export function pickRecommendedPlan<T extends { monthlyFee: number }>(
  plans: T[],
  budgetScore: number,
): T | null {
  if (plans.length === 0) return null;

  const ceiling = BUDGET_CEILINGS[budgetScore - 1] ?? BUDGET_CEILINGS[0];
  const affordable = plans.filter((plan) => plan.monthlyFee <= ceiling);

  if (affordable.length === 0) {
    return plans.reduce((cheapest, plan) =>
      plan.monthlyFee < cheapest.monthlyFee ? plan : cheapest,
    );
  }

  return affordable.reduce((best, plan) =>
    plan.monthlyFee > best.monthlyFee ? plan : best,
  );
}
