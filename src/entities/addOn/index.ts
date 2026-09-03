// entities/addOn Public API — 클라이언트에서 안전한 것만.
// 서버 전용(addOnRepository)은 @/entities/addOn/server 로 따로 가져간다.
export type { AddOn, AddOnDescription } from './types';
export { ADD_ON_ICONS, ADD_ON_ICON_FALLBACK } from './lib/icons';
export { default as AddOnListItem } from './ui/AddOnListItem';
