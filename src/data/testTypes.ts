import type { PlanType } from '@/types/test';

// TEST-006: 사전에 정의된 판정 기준
// 유형 판정 점수 = 1,2,3,5번 문항 점수 합 (4 ~ 16)
// 구간이 겹치지 않고 4~16 을 빠짐없이 덮으므로 같은 응답이면 항상 같은 유형이 나온다.
export const PLAN_TYPES: PlanType[] = [
  {
    id: 'jamjam',
    name: '조용조용 절약형 잠잠무너',
    description:
      '문자와 전화만으로도 충분한, 스마트폰에 크게 얽매이지 않는 타입이에요.',
    imageSrc: '/images/test/type-jamjam.png',
    minScore: 4,
    maxScore: 7,
    benefits: [
      {
        icon: 'shield',
        title: 'U+ 안심존 서비스',
        description: '스팸차단, 악성코드 방지',
      },
      {
        icon: 'wifi',
        title: 'U+ Zone Wi-Fi 무료',
        description: '전국 22만개 AP 무제한 이용',
      },
    ],
  },
  {
    id: 'daily',
    name: '밸런스가 딱인 데일리무너',
    description:
      'SNS 확인하고, 웹서핑하고, 카톡으로 대화하는 게 하루 루틴인 타입이에요.',
    imageSrc: '/images/test/type-daily.png',
    minScore: 8,
    maxScore: 10,
    benefits: [
      {
        icon: 'wifi',
        title: 'U+ Zone Wi-Fi 무료',
        description: '전국 22만개 AP 무제한 이용',
      },
      {
        icon: 'shield',
        title: 'U+ 안심존 서비스',
        description: '스팸차단, 악성코드 방지',
      },
    ],
  },
  {
    id: 'pop',
    name: '콘텐츠를 좋아하는 팝팝무너',
    description:
      '밖에서도 유튜브·OTT를 즐겨 보고, 가끔 노트북에 테더링도 연결하는 타입이에요.',
    imageSrc: '/images/test/type-pop.png',
    minScore: 11,
    maxScore: 13,
    benefits: [
      {
        icon: 'monitor',
        title: '넷플릭스 베이직 12개월 무료',
        description: '월 9,500원 상당',
      },
      {
        icon: 'wifi',
        title: 'U+ Zone Wi-Fi 무료',
        description: '전국 22만개 AP 무제한 이용',
      },
    ],
  },
  {
    id: 'super',
    name: '데이터를 많이 쓰는 슈퍼무너',
    description:
      '하루종일 데이터를 쓰고, 노트북·태블릿까지 폰 하나로 연결해서 쓰는 헤비유저예요.',
    imageSrc: '/images/test/type-super.png',
    minScore: 14,
    maxScore: 16,
    benefits: [
      {
        icon: 'monitor',
        title: '넷플릭스 베이직 12개월 무료',
        description: '월 9,500원 상당',
      },
      {
        icon: 'wifi',
        title: 'U+ Zone Wi-Fi 무료',
        description: '전국 22만개 AP 무제한 이용',
      },
      {
        icon: 'shield',
        title: 'U+ 안심존 서비스',
        description: '스팸차단, 악성코드 방지',
      },
    ],
  },
];
