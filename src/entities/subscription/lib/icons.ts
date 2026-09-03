import {
  BookOpen,
  Clapperboard,
  Coffee,
  Music,
  ShoppingBag,
  Sparkles,
  Ticket,
  type LucideIcon,
} from 'lucide-react';

// subscriptions.description.icon 값과 목록에 그릴 아이콘의 연결.
// 아이콘 키가 늘어나면 이 표만 고치면 된다. entities/addOn/lib/icons와 같은
// 자리 - features/catalog와 features/chat 둘 다 참조해서 entities에 둔다.
export const SUBSCRIPTION_ICONS: Record<string, LucideIcon> = {
  icon_video: Clapperboard,
  icon_music: Music,
  icon_book: BookOpen,
  icon_coffee: Coffee,
  icon_movie: Ticket,
  icon_shopping: ShoppingBag,
};

// 표에 없는 키이거나 icon 값이 없을 때 쓰는 기본 아이콘
export const SUBSCRIPTION_ICON_FALLBACK: LucideIcon = Sparkles;
