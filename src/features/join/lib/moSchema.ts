import { z } from 'zod';

import { OCTOMO_RECEIVER_DIGITS } from '@/features/join/data/mo';

/**
 * MO 인증 문자에 담는 코드의 자릿수.
 * QR 로 자동 입력되지만, 문자 앱에서 사람 눈에 보이는 값이라 짧게 잡는다.
 */
export const MO_CODE_LENGTH = 6;

const MO_CODE_PATTERN = new RegExp(`^\\d{${MO_CODE_LENGTH}}$`);

/**
 * CARD-037: OCTOMO 는 010으로 시작하는 11자리만 받는다(그 외에는 400).
 * 화면에서 걸러 보내지만, 서버도 같은 기준으로 다시 확인한다.
 */
export const mobileNumSchema = z
  .string()
  .regex(/^010\d{8}$/, '휴대폰 번호를 010으로 시작하는 11자리로 입력해 주세요');

/**
 * 우리 코드 형식만 통과시킨다 - 이 자리를 열어두면 우리 API 키로 아무 문자열이나
 * QR 로 만들어 주는 창구가 된다.
 */
const moCodeSchema = z
  .string()
  .regex(MO_CODE_PATTERN, `인증 코드는 숫자 ${MO_CODE_LENGTH}자리여야 합니다`);

export const moQrRequestSchema = z.object({ code: moCodeSchema });

export const moExistsRequestSchema = z.object({
  mobileNum: mobileNumSchema,
  code: moCodeSchema,
});

export type MoQrRequest = z.infer<typeof moQrRequestSchema>;
export type MoExistsRequest = z.infer<typeof moExistsRequestSchema>;

/** 숫자 MO_CODE_LENGTH 자리 인증 코드를 만든다 */
export function createMoCode(): string {
  const max = 10 ** MO_CODE_LENGTH;

  return String(Math.floor(Math.random() * max)).padStart(MO_CODE_LENGTH, '0');
}

/**
 * 문자 앱이 있는 기기인지 - 인증 방법 탭의 기본값을 여기서 가른다.
 * 아이패드는 UA 를 맥으로 보내므로 터치 여부까지 같이 봐야 한다.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  const { userAgent, maxTouchPoints } = navigator;

  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)) return true;

  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/**
 * 수신번호와 본문이 채워진 채로 문자 앱을 여는 링크.
 *
 * 구분자가 갈린다 - RFC 5724 는 `?body=` 인데 iOS 문자 앱은 그걸 못 알아듣고
 * `&body=` 를 쓴다. 그래서 기기를 보고 골라야 한다. 서버에서는 판단할 방법이
 * 없으므로(navigator 가 없다) 그때는 표준 쪽으로 둔다.
 */
export function buildSmsHref(code: string): string {
  const isIos =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod/.test(navigator.userAgent);

  return `sms:${OCTOMO_RECEIVER_DIGITS}${isIos ? '&' : '?'}body=${encodeURIComponent(code)}`;
}
