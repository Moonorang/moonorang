import { TEST_QUESTIONS } from '@/features/test/data/questions';
import { LEISURE_TYPES } from '@/features/test/data/leisureTypes';
import type { Diagnosis } from '@/features/test/types';

/**
 * TEST-006: 응답을 취미 성향 유형으로 판정한다.
 *
 * 외부 입출력이 전혀 없는 순수 함수라, 같은 응답이면 언제나 같은 결과가 나온다.
 * answers 는 TEST_QUESTIONS 와 같은 순서의 선택지 score 배열이다.
 * 건너뛴 문항(null)은 최저 점수로 계산하고, 고르지 않았으니 키워드도 남기지 않는다.
 */
export function diagnoseLeisureType(answers: (number | null)[]): Diagnosis {
  let typeScore = 0;
  const keywords: string[] = [];

  TEST_QUESTIONS.forEach((question, index) => {
    const score = answers[index];

    typeScore += score ?? 1;

    if (score === null || score === undefined) return;

    const chosen = question.options.find((option) => option.score === score);
    if (chosen) keywords.push(chosen.keyword);
  });

  // 구간이 5~20 을 빈틈없이 덮지만, 방어적으로 마지막 유형을 fallback 으로 둔다.
  const type =
    LEISURE_TYPES.find(
      (candidate) =>
        typeScore >= candidate.minScore && typeScore <= candidate.maxScore,
    ) ?? LEISURE_TYPES[LEISURE_TYPES.length - 1];

  return { type, typeScore, keywords };
}
