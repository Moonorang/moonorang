import type { SelectOption } from '@/shared/ui/SelectField';

/**
 * CARD-038: 카드 등록에서 고르는 카드사.
 * 카드번호 앞자리로 알 수 있는 건 국제 브랜드(Visa·Master 등)뿐이고 국내 카드사는
 * 가릴 수 없어서, 실제 결제창처럼 사용자가 직접 고르게 한다.
 */
export const CARD_ISSUERS: SelectOption[] = [
  { value: 'shinhan', label: '신한' },
  { value: 'kb', label: 'KB국민' },
  { value: 'samsung', label: '삼성' },
  { value: 'hyundai', label: '현대' },
  { value: 'lotte', label: '롯데' },
  { value: 'woori', label: '우리' },
  { value: 'hana', label: '하나' },
  { value: 'nh', label: 'NH농협' },
  { value: 'bc', label: 'BC' },
  { value: 'citi', label: '씨티' },
  { value: 'kakaobank', label: '카카오뱅크' },
  { value: 'tossbank', label: '토스뱅크' },
];

const ISSUER_VALUES = CARD_ISSUERS.map((issuer) => String(issuer.value));

export function isCardIssuer(value: string): boolean {
  return ISSUER_VALUES.includes(value);
}
