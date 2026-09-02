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

// add_ons.description.icon 값과 목록에 그릴 아이콘의 연결.
// 아이콘 키가 늘어나면 이 표만 고치면 된다. features/catalog와 features/chat
// 둘 다 참조해서 entities에 둔다(feature끼리 직접 참조하지 않기 위함).
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
