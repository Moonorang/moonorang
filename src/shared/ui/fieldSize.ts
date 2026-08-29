export type FieldSize = 'sm' | 'md';

/**
 * 입력 요소의 크기 토큰.
 *
 * 높이·글자 크기를 개별 숫자로 받지 않고 토큰 하나로 받는 이유는,
 * 나란히 놓이는 요소들(입력 칸 + 성별 토글, 셀렉트 + 화살표 아이콘)이
 * 같은 표를 참조해야 높이와 균형이 어긋나지 않기 때문이다.
 * 새 크기가 필요하면 여기에 한 줄 추가하면 전부 따라온다.
 */
export const FIELD_SIZE_STYLES: Record<FieldSize, string> = {
  sm: 'px-3 py-2 text-12',
  md: 'px-4 py-3 text-14',
};

/**
 * 입력 칸 옆에 나란히 서는 요소(성별 토글 등)가 높이를 맞출 때 쓰는,
 * 가로 여백을 뺀 버전. 그런 요소는 폭을 따로 정하는 경우가 많다.
 */
export const FIELD_HEIGHT_STYLES: Record<FieldSize, string> = {
  sm: 'py-2 text-12',
  md: 'py-3 text-14',
};

/** 셀렉트 화살표가 겹치지 않도록 확보하는 오른쪽 여백 */
export const FIELD_SELECT_PADDING: Record<FieldSize, string> = {
  sm: 'pr-8',
  md: 'pr-10',
};

/** 크기에 맞춘 아이콘 픽셀 */
export const FIELD_ICON_SIZE: Record<FieldSize, number> = {
  sm: 16,
  md: 20,
};

/** 크기와 무관한 공통 모양 (테두리·배경·포커스) */
export const FIELD_BASE_CLASS =
  'w-full rounded-md border border-border-gray bg-neutral-pure-white text-text-main transition-colors outline-none placeholder:text-text-secondary focus:border-primary-red';
