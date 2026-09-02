import {
  DatabaseZap,
  Headphones,
  Music,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  Shield,
  Smartphone,
  Sparkles,
  Tv,
  Video,
  type LucideIcon,
} from 'lucide-react';

import type { CatalogTab, CatalogTabItem } from '@/features/catalog/types';

// 탭 구성이 바뀌면 CatalogTabs 가 아니라 이 배열만 고친다.
export const CATALOG_TABS: CatalogTabItem[] = [
  { key: 'plans', label: '요금제' },
  { key: 'addOns', label: '부가서비스' },
  { key: 'subscriptions', label: '구독 상품' },
  { key: 'memberships', label: '멤버십' },
];

// COMMON-003: 탭별로 표시할 데이터가 없을 때의 안내 문구
export const CATALOG_EMPTY_MESSAGES: Record<CatalogTab, string> = {
  plans: '등록된 요금제가 없어요.',
  addOns: '등록된 부가서비스가 없어요.',
  subscriptions: '등록된 구독 상품이 없어요.',
  memberships: '등록된 멤버십 제휴처가 없어요.',
};

// add_ons.description.icon 값과 목록에 그릴 아이콘의 연결.
// 아이콘 키가 늘어나면 이 표만 고치면 된다.
export const ADD_ON_ICONS: Record<string, LucideIcon> = {
  icon_shield: Shield,
  icon_music: Music,
  icon_phone_dual: Smartphone,
  icon_data_safe: DatabaseZap,
  icon_video: Video,
  icon_headphones: Headphones,
  icon_tv: Tv,
  icon_phone_call: PhoneCall,
  icon_phone_forwarded: PhoneForwarded,
  icon_phone_off: PhoneOff,
};

// 표에 없는 키이거나 icon 값이 없을 때 쓰는 기본 아이콘
export const ADD_ON_ICON_FALLBACK: LucideIcon = Sparkles;

// 목록 카드 이미지가 놓인 public 경로 (DB 에는 파일명만 저장돼 있다)
export const CATALOG_IMAGE_BASE_PATH = '/images/catalog';
