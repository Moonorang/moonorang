import type { LeisureType } from '@/features/test/types';

// TEST-006: 사전에 정의된 판정 기준
// 유형 판정 점수 = 다섯 문항 점수의 합 (5 ~ 20)
// 네 구간이 겹치지 않고 5~20 을 빠짐없이 덮으므로 같은 응답이면 항상 같은 유형이 나온다.
// 캐릭터 그림은 원래 요금제 성향 검사에 쓰던 것을 그대로 쓴다.
export const LEISURE_TYPES: LeisureType[] = [
  {
    id: 'jamjam',
    name: '이불 밖은 위험한 잠잠무너',
    description:
      '집이 제일 편하고, 아무것도 안 하는 시간이 가장 큰 휴식인 타입이에요.',
    imageSrc: '/images/test/type-jamjam.png',
    minScore: 5,
    maxScore: 8,
    benefits: [
      {
        icon: 'monitor',
        title: '넷플릭스 베이직 12개월 무료',
        description: '월 9,500원 상당',
      },
      {
        icon: 'shield',
        title: 'U+ 안심존 서비스',
        description: '스팸차단, 악성코드 방지',
      },
    ],
  },
  {
    id: 'daily',
    name: '소소하게 즐기는 데일리무너',
    description:
      '집에서 보는 콘텐츠와 동네 한 바퀴로 하루가 알맞게 채워지는 타입이에요.',
    imageSrc: '/images/test/type-daily.png',
    minScore: 9,
    maxScore: 12,
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
    id: 'pop',
    name: '취미 부자 팝팝무너',
    description:
      '배우고 만들고 보러 다니느라, 하고 싶은 게 늘 쌓여 있는 타입이에요.',
    imageSrc: '/images/test/type-pop.png',
    minScore: 13,
    maxScore: 16,
    benefits: [
      {
        icon: 'wifi',
        title: 'U+ Zone Wi-Fi 무료',
        description: '전국 22만개 AP 무제한 이용',
      },
      {
        icon: 'monitor',
        title: '넷플릭스 베이직 12개월 무료',
        description: '월 9,500원 상당',
      },
      {
        icon: 'shield',
        title: 'U+ 안심존 서비스',
        description: '스팸차단, 악성코드 방지',
      },
    ],
  },
  {
    id: 'super',
    name: '주말이 더 바쁜 슈퍼무너',
    description:
      '쉬는 날일수록 밖으로 나가고, 사람들과 어울릴 때 힘이 나는 타입이에요.',
    imageSrc: '/images/test/type-super.png',
    minScore: 17,
    maxScore: 20,
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
];
