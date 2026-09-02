import { z } from 'zod';

import { isCardIssuer } from '@/features/join/data/cardIssuers';

/**
 * 카드번호 자릿수. 아멕스만 15자리이고 나머지 국제 브랜드는 16자리다.
 * 국내 카드사도 브랜드를 얹어 발급하므로 이 두 가지로 충분하다.
 */
const AMEX_LENGTH = 15;
const DEFAULT_LENGTH = 16;

/** 유효기간을 이 해 수보다 멀리 잡으면 오타로 본다 */
const MAX_YEARS_AHEAD = 20;

/**
 * 화면에 보이는 값에는 자리 구분 공백이 섞여 있다(4111 1111 ...).
 * 검증은 전부 숫자만 뽑아서 한다.
 */
function toDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** 앞자리로 아멕스인지 가린다 - 자릿수와 자리 구분 묶음이 달라진다 */
export function isAmexNumber(digits: string): boolean {
  return digits.startsWith('34') || digits.startsWith('37');
}

/** 카드는 표기된 달의 말일까지 쓸 수 있다 - 이번 달이면 아직 유효하다 */
function isUsableExpiry(digits: string): boolean {
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2, 4));

  const now = new Date();
  const thisMonth = now.getFullYear() * 12 + now.getMonth();
  const expiryMonth = year * 12 + (month - 1);

  return (
    expiryMonth >= thisMonth && expiryMonth <= thisMonth + MAX_YEARS_AHEAD * 12
  );
}

/**
 * CARD-038 / CARD-039: 카드 등록 입력값과 항목별 오류 문구.
 *
 * 더미 처리라 카드번호는 자릿수만 본다 - 실제 카드사가 쓰는 체크섬(Luhn)까지
 * 걸면 시연할 때 아무 번호나 못 넣게 되고, 얻는 것도 없다.
 */
export const cardSchema = z.object({
  issuer: z.string().refine(isCardIssuer, '카드사를 선택해 주세요'),
  cardNumber: z.string().refine((value) => {
    const digits = toDigits(value);

    return (
      digits.length === (isAmexNumber(digits) ? AMEX_LENGTH : DEFAULT_LENGTH)
    );
  }, '카드 번호를 정확히 입력해 주세요'),
  expiry: z
    .string()
    .refine(
      (value) => /^(0[1-9]|1[0-2])\d{2}$/.test(toDigits(value)),
      '유효기간을 MMYY 형식으로 입력해 주세요',
    )
    .refine(
      (value) => isUsableExpiry(toDigits(value)),
      '유효기간이 지난 카드입니다',
    ),
});

export type CardValues = z.infer<typeof cardSchema>;

/** 최종 확인·기록에 남길 때 쓰는 형태 - 뒤 4자리만 남긴다 */
export function maskCardNumber(value: string): string {
  const digits = toDigits(value);

  return `**** **** **** ${digits.slice(-4)}`;
}
