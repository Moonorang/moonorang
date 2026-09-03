import {
  BatteryCharging,
  Cloud,
  Crown,
  Gift,
  Globe,
  MonitorPlay,
  Plane,
  ShieldCheck,
  Share2,
  Sparkles,
  Tablet,
  Ticket,
  Users,
  Wifi,
} from 'lucide-react';

import type { PlanBenefitItem, PlanBenefits } from '@/entities/plan/types';

/*
 * plans.benefits 는 "키: 설명 문장" 평면 구조라 값 문자열만 있고
 * 무엇에 대한 값인지가 없다. 상세 카드의 혜택 행은 "아이콘 + 제목 + 부제" 이므로,
 * 키마다 붙일 아이콘·색·제목을 여기서 정하고 DB 값은 부제로 흘려보낸다.
 *
 * 요금제마다 들어 있는 키가 달라서(하위 요금제 4개 ~ 상위 요금제 6개) 행 수도 달라진다.
 * 표시 순서는 요금제의 키 순서가 아니라 이 배열 순서를 따른다 - 어느 요금제를 열어도
 * 같은 종류의 혜택이 같은 자리에 오게. 총 혜택가는 나머지를 합한 값이라 아래쪽에 둔다.
 *
 * tethering_sharing 은 상세 카드 위쪽 제공량 목록에 "쉐어링 100GB" 로 이미 나와서
 * 여기서는 뺀다 - 한 카드 안에 같은 값이 두 번 나오지 않게.
 */
const BENEFIT_LABELS: Omit<PlanBenefitItem, 'subTitle'>[] = [
  {
    key: 'media_contents',
    icon: MonitorPlay,
    tone: 'secondary',
    title: '미디어 콘텐츠',
  },
  { key: 'vip_membership', icon: Crown, tone: 'accent1', title: 'VIP 멤버십' },
  { key: 'roaming', icon: Globe, tone: 'accent2', title: '해외 로밍' },
  {
    key: 'data_refill',
    icon: BatteryCharging,
    tone: 'primary',
    title: '데이터 충전',
  },
  {
    key: 'data_sharing',
    icon: Share2,
    tone: 'secondary',
    title: '데이터 나눔',
  },
  { key: 'coupon_benefit', icon: Ticket, tone: 'accent1', title: '제휴 쿠폰' },
  { key: 'cloud_storage', icon: Cloud, tone: 'accent2', title: '클라우드' },
  {
    key: 'device_care',
    icon: ShieldCheck,
    tone: 'primary',
    title: '단말 보호',
  },
  {
    key: 'family_discount',
    icon: Users,
    tone: 'secondary',
    title: '가족 결합 할인',
  },
  { key: 'home_bundle', icon: Wifi, tone: 'accent1', title: '집 결합 할인' },
  { key: 'smart_device', icon: Tablet, tone: 'accent2', title: '스마트기기' },
  { key: 'airport_lounge', icon: Plane, tone: 'primary', title: '공항 라운지' },
  {
    key: 'max_benefit_value',
    icon: Sparkles,
    tone: 'accent1',
    title: '총 혜택가',
  },
];

const HIDDEN_BENEFIT_KEYS = ['tethering_sharing'];

// 위 목록에 없는 키가 DB 에 새로 생겨도 값이 통째로 사라지지는 않게 하는 자리.
// 제목을 붙일 수 없으니 값만 '기타 혜택'으로 내보내고, 자주 보이면 위에 추가한다.
const FALLBACK_LABEL: Omit<PlanBenefitItem, 'key' | 'subTitle'> = {
  icon: Gift,
  tone: 'primary',
  title: '기타 혜택',
};

/**
 * plans.benefits 를 상세 카드의 혜택 행 목록으로 바꾼다.
 * 값이 없는 키는 행 자체를 만들지 않아서, 보여줄 혜택이 없으면 빈 배열이 된다.
 */
export function getPlanBenefitItems(
  benefits: PlanBenefits | null,
): PlanBenefitItem[] {
  if (!benefits) return [];

  const knownItems = BENEFIT_LABELS.flatMap((label) => {
    const value = benefits[label.key];
    return value ? [{ ...label, subTitle: value }] : [];
  });

  const knownKeys = new Set([
    ...BENEFIT_LABELS.map((label) => label.key),
    ...HIDDEN_BENEFIT_KEYS,
  ]);
  const unknownItems = Object.entries(benefits).flatMap(([key, value]) =>
    !knownKeys.has(key) && value
      ? [{ ...FALLBACK_LABEL, key, subTitle: value }]
      : [],
  );

  return [...knownItems, ...unknownItems];
}
