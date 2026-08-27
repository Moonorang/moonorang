import type { TestQuestion } from '@/types/test';

// TEST-002: 5문항 객관식
// TEST-003: 데이터 이용 행태(1,2), 부가서비스 선호(3), 가격 민감도(4), 데이터 민감도(5)
// 선택지는 모두 1 -> 4 로 강도가 커지는 순서이며 score 가 곧 강도다.
export const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: '스마트폰을 가장 많이 쓰는 순간은?',
    countsTowardType: true,
    options: [
      { score: 1, label: '전화 문자 확인할 때가 대부분' },
      { score: 2, label: '인스타, 카톡 같은 SNS 둘러볼 때' },
      { score: 3, label: '유튜브, OTT 영상 볼 때' },
      { score: 4, label: '게임, 화상회의 등 헤비하게 계속 사용' },
    ],
  },
  {
    id: 2,
    question: '와이파이가 없는 곳에서 데이터를 쓰는 빈도는?',
    countsTowardType: true,
    options: [
      { score: 1, label: '거의 안 씀, 와이파이만 사용' },
      { score: 2, label: '가끔, 필요할 때만' },
      { score: 3, label: '밖에 있을 때 자주 사용' },
      { score: 4, label: '항상, 와이파이 잘 안 잡음' },
    ],
  },
  {
    id: 3,
    question: '핫스팟(테더링)으로 노트북·태블릿 연결하는 편인가요?',
    countsTowardType: true,
    options: [
      { score: 1, label: '전혀 안 함' },
      { score: 2, label: '아주 가끔' },
      { score: 3, label: '종종 사용함' },
      { score: 4, label: '매일 사용, 필수' },
    ],
  },
  {
    id: 4,
    // 예산은 성향 유형이 아니라 추천 요금제를 고를 때 쓴다.
    question: '한 달 통신비로 지출 가능한 예산은?',
    countsTowardType: false,
    options: [
      { score: 1, label: '4만원 이하' },
      { score: 2, label: '4~6만원' },
      { score: 3, label: '6~8만원' },
      { score: 4, label: '8만원 이상, 무제한이면 좋겠음' },
    ],
  },
  {
    id: 5,
    question: '데이터가 부족해지면 드는 생각은?',
    countsTowardType: true,
    options: [
      { score: 1, label: '애초에 그럴 일이 별로 없음' },
      { score: 2, label: '속도 제한 걸려도 크게 신경 안 씀' },
      { score: 3, label: '답답해서 데이터 추가 구매함' },
      { score: 4, label: '생각만 해도 스트레스, 무조건 무제한' },
    ],
  },
];
