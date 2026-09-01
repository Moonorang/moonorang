import { isAmexNumber } from '@/features/join/lib/cardSchema';

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

/**
 * 카드 번호 - 실제 결제창처럼 네 자리마다 띄운다.
 * 아멕스는 자릿수(15)도 묶음(4-6-5)도 달라서 따로 끊는다.
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (isAmexNumber(digits)) {
    const trimmed = digits.slice(0, 15);

    return [trimmed.slice(0, 4), trimmed.slice(4, 10), trimmed.slice(10)]
      .filter(Boolean)
      .join(' ');
  }

  return (digits.slice(0, 16).match(/\d{1,4}/g) ?? []).join(' ');
}

/** 유효기간 - MMYY 를 MM / YY 로 보여준다 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
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
