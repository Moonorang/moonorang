// 값이 없는 것과 마찬가지인 자리표시자 - 상세 항목에서 숨긴다.
const PLACEHOLDER_VALUES = ['미확인', '-', ''];

export function isMeaningful(value?: string | null): value is string {
  return !!value && !PLACEHOLDER_VALUES.includes(value.trim());
}
