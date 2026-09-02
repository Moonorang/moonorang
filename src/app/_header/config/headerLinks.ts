import { Gift, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// HEADER-003: 헤더 우측에 노출하는 이동 항목.
// 구성이 바뀌면 Header 가 아니라 이 파일만 고친다.

// 아직 config 안에서만 쓰이므로 export 하지 않는다.
// ui 쪽에서도 이 타입이 필요해지면 그때 슬라이스 types.ts 로 올린다.
interface HeaderLink {
  /** 아이콘만 보이므로 이 문구는 보조기술이 읽는 이름으로만 쓰인다 */
  label: string;
  href: string;
  icon: LucideIcon;
}

export const HEADER_LINKS: HeaderLink[] = [
  { label: '마이 페이지', href: '/mypage', icon: User },
  { label: '상품·혜택', href: '/catalog', icon: Gift },
];
