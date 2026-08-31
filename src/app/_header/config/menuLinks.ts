// HEADER-003: 햄버거 메뉴 항목.
// 메뉴 구성이 바뀌면 SideMenu 가 아니라 이 파일만 고친다.

// 아직 config 안에서만 쓰이므로 export 하지 않는다.
// ui 쪽에서도 이 타입이 필요해지면 그때 슬라이스 types.ts 로 올린다.
interface MenuLink {
  label: string;
  href: string;
}

export const MENU_LINKS: MenuLink[] = [
  { label: '상품·혜택', href: '/catalog' },
];
