import { Gift, MonitorPlay, Shield, Wifi } from 'lucide-react';

import type { PlanBenefitDetail, PlanBenefitItem } from '@/entities/plan/types';

/*
 * plans.benefits 는 문자열 네 개짜리 평면 구조라(media_contents, vip_membership,
 * max_benefit_value, tethering_sharing) 상세 카드가 필요로 하는
 * "아이콘 + 제목 + 부제" 목록을 만들 수 없다. 요금제와 부가서비스를 잇는
 * 테이블도 아직 없다. DB 가 갖춰질 때까지 쓰는 더미다.
 *
 * 미디어 혜택은 plans.benefits.media_contents 실제 값을 기준으로 다듬었고,
 * 상당액은 넷플릭스 국내 공시 요금(광고형 스탠다드 5,500 / 스탠다드 13,500 /
 * 프리미엄 17,000)을 따랐다. 나머지는 너겟 요금제 공통 혜택이다.
 */

// 미디어 혜택은 media_contents 가 있는 요금제(너겟59·65·69·75)에만 붙는다
const MEDIA_BENEFITS: Record<number, PlanBenefitItem> = {
  8: {
    icon: MonitorPlay,
    tone: 'secondary',
    title: '넷플릭스 광고형 무료',
    subTitle: '스탠다드 · 월 5,500원 상당',
  },
  9: {
    icon: MonitorPlay,
    tone: 'secondary',
    title: '넷플릭스 스탠다드 무료',
    subTitle: '월 13,500원 상당',
  },
  10: {
    icon: MonitorPlay,
    tone: 'secondary',
    title: '넷플릭스 프리미엄 무료',
    subTitle: '월 17,000원 상당',
  },
  11: {
    icon: MonitorPlay,
    tone: 'secondary',
    title: '콘텐츠·음악 감상 혜택',
    subTitle: '최대 15,000원/월 상당',
  },
};

// 요금제와 무관하게 모든 너겟 요금제에 붙는 혜택
const COMMON_MAIN_BENEFITS: PlanBenefitItem[] = [
  {
    icon: Wifi,
    tone: 'accent1',
    title: 'U+ Zone Wi-Fi 무료',
    subTitle: '전국 22만개 AP 무제한 이용',
  },
  {
    icon: Shield,
    tone: 'accent2',
    title: 'U+ 안심존 서비스',
    subTitle: '스팸차단, 악성코드 방지',
  },
];

const COMMON_ADD_ON_SERVICES: PlanBenefitItem[] = [
  { icon: Gift, tone: 'primary', title: 'U+ 포인트 적립' },
  { icon: Gift, tone: 'primary', title: '우리집 인터넷 결합 할인' },
];

export function getPlanBenefitDetail(planId: number): PlanBenefitDetail {
  const media = MEDIA_BENEFITS[planId];

  return {
    mainBenefits: media
      ? [media, ...COMMON_MAIN_BENEFITS]
      : COMMON_MAIN_BENEFITS,
    addOnServices: COMMON_ADD_ON_SERVICES,
  };
}
