/*
 * 가입 절차의 입력 표시 형식.
 * 회원가입(features/auth)에도 같은 모양의 날짜 포맷이 있지만 feature 끼리
 * 직접 가져다 쓰지 않는다. 세 번째 화면이 같은 형식을 요구하면 그때
 * shared/utils 로 올린다.
 */

/** 주민등록번호 앞자리 - 숫자 6개 */
export function formatRrnFront(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

/** 주민등록번호 뒷자리 - 숫자 7개 */
export function formatRrnBack(value: string): string {
  return value.replace(/\D/g, '').slice(0, 7);
}

/** 휴대폰 번호 - 숫자 11개 (OCTOMO 가 하이픈 없는 형태만 받는다) */
export function formatMobileNum(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

/** 발급일자 - 숫자만 남겨 2001.11.11 형태로 */
export function formatIssuedDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}
