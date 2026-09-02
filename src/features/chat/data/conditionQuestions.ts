import type { QuestionOption } from '@/shared/ui/QuestionCard';

/**
 * 선택형 질문 카드는 선택지가 숫자 하나(QuestionOption.value)로 값이 매겨지는
 * ChatKeywords 필드에만 쓸 수 있다. interests처럼 배열인 필드는 여기 못 들어간다 -
 * keyof ChatKeywords 전체를 쓰면 그런 필드도 타입상 허용돼버려서 명시적으로 좁혀둔다.
 */
export type ConditionKeywordField = 'budget' | 'dataUsageGb' | 'tetheringGb';

export interface ConditionQuestion {
  id: number;
  /** 이 문항의 답이 반영될 keywords 필드 */
  keywordField: ConditionKeywordField;
  /** 대화 이력 요약(CARD-012)에 쓰는 짧은 라벨. 카드에 뜨는 질문 문장과는 별개 */
  summaryLabel: string;
  question: string;
  options: QuestionOption[];
}

/**
 * CARD-008~015: 채팅 안에서 선택형으로 조건을 수집하는 문항.
 * budget 티어는 성향검사(features/test/data/questions.ts)의 예산 문항과 같은 구간
 * (4만/4~6만/6~8만/8만 이상)을 그대로 써서 앱 전체에서 예산 구간 표현을 통일한다.
 */
export const CONDITION_QUESTIONS: ConditionQuestion[] = [
  {
    id: 1,
    keywordField: 'dataUsageGb',
    summaryLabel: '데이터 사용량',
    question: '한 달 데이터는 어느 정도 쓰세요?',
    options: [
      { value: 3, label: '가볍게 써요 (문자·전화 위주)' },
      { value: 10, label: '적당히 써요 (SNS, 카톡 정도)' },
      { value: 25, label: '많이 써요 (영상·OTT 자주 봄)' },
      { value: 100, label: '아주 많이 써요 (무제한급)' },
    ],
  },
  {
    id: 2,
    keywordField: 'budget',
    summaryLabel: '예산',
    question: '한 달 통신비 예산은 어느 정도로 생각하세요?',
    options: [
      { value: 40_000, label: '4만원 이하' },
      { value: 60_000, label: '4~6만원' },
      { value: 80_000, label: '6~8만원' },
      { value: Number.POSITIVE_INFINITY, label: '8만원 이상, 상관없어요' },
    ],
  },
  {
    id: 3,
    keywordField: 'tetheringGb',
    summaryLabel: '테더링/쉐어링',
    question: '테더링(핫스팟)은 얼마나 쓰세요?',
    options: [
      { value: 0, label: '거의 안 써요' },
      { value: 10, label: '가끔 써요 (노트북 잠깐)' },
      { value: 30, label: '자주 써요' },
      { value: 60, label: '많이 써요 (거의 매일)' },
    ],
  },
];
