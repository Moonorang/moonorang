/**
 * 가입 완료(CARD-043)에서 코드를 안 고치고 바꿀 수 있는 값.
 */

import type { JoinKind } from '@/entities/join/types';

/** CARD-043: 가입을 마친 뒤 축하 카드에 적는 문구 */
export const JOIN_COMPLETE_MESSAGE: Record<JoinKind, string> = {
  plan: '요금제 가입이 완료되었습니다!',
  addOn: '부가서비스 가입이 완료되었습니다!',
  subscription: '구독 상품 가입이 완료되었습니다!',
};

/**
 * 결제하기를 누른 뒤 가입 결과가 나오기까지 기다리는 시간(ms).
 * 실제 결제 연동이 없어서, 처리 중이라는 느낌만 주고 끝나면 완료로 본다.
 */
export const PAYMENT_DELAY_MS = 1200;
