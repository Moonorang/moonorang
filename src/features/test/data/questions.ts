import type { TestQuestion } from '@/features/test/types';

// TEST-002: 5문항 객관식
// 휴식·취미·여가를 어떻게 보내는지 묻는다. 선택지는 모두 1 -> 4 로
// "집에서 가만히" 에서 "밖에서 활발하게" 쪽으로 강도가 커지고, score 가 곧 강도다.
// keyword 는 그 선택지가 뜻하는 취미를 한 낱말로 붙인 것이다.
export const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: '약속 하나 없는 주말, 어떻게 보내나요?',
    options: [
      { score: 1, label: '침대 밖으로 안 나감', keyword: '집콕' },
      { score: 2, label: '집에서 영화나 드라마 몰아보기', keyword: '몰아보기' },
      {
        score: 3,
        label: '동네 카페까지는 산책 삼아 나감',
        keyword: '동네산책',
      },
      { score: 4, label: '어디든 나가서 하루를 꽉 채움', keyword: '나들이' },
    ],
  },
  {
    id: 2,
    question: '쉴 때 가장 자주 하는 건?',
    options: [
      { score: 1, label: '아무것도 안 하고 멍때리기', keyword: '멍때리기' },
      { score: 2, label: '유튜브나 OTT 보기', keyword: 'OTT' },
      { score: 3, label: '게임 한 판, 아니면 음악 듣기', keyword: '게임' },
      { score: 4, label: '운동하면서 몸 쓰기', keyword: '운동' },
    ],
  },
  {
    id: 3,
    question: '여행을 간다면 어느 쪽에 가깝나요?',
    options: [
      { score: 1, label: '여행보다는 집이 제일 좋음', keyword: '집순이집돌이' },
      { score: 2, label: '가까운 곳에서 당일치기', keyword: '당일치기' },
      { score: 3, label: '일정 짜서 국내 여행', keyword: '국내여행' },
      { score: 4, label: '일단 비행기표부터 예약', keyword: '해외여행' },
    ],
  },
  {
    id: 4,
    question: '새 취미를 시작한다면?',
    options: [
      {
        score: 1,
        label: '혼자 조용히 하는 것 (독서, 뜨개질)',
        keyword: '혼자취미',
      },
      { score: 2, label: '집에서 만드는 것 (요리, 홈카페)', keyword: '홈카페' },
      { score: 3, label: '배우러 다니는 것 (공방, 클래스)', keyword: '배우기' },
      { score: 4, label: '같이 하는 것 (동호회, 러닝크루)', keyword: '동호회' },
    ],
  },
  {
    id: 5,
    question: '하루 중 가장 기다려지는 시간은?',
    options: [
      { score: 1, label: '이불 속에 들어가는 잠들기 직전', keyword: '늦잠' },
      { score: 2, label: '저녁에 소파에 눕는 시간', keyword: '집콕휴식' },
      { score: 3, label: '할 일 끝내고 취미에 쓰는 시간', keyword: '취미시간' },
      { score: 4, label: '나갈 준비를 하는 주말 아침', keyword: '외출' },
    ],
  },
];
