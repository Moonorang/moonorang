/**
 * MO 본인 인증(CARD-037)에서 코드를 안 고치고 바뀔 수 있는 값.
 * 서버(OCTOMO 호출)와 화면(안내 문구) 양쪽에서 쓰므로 server/ 가 아니라 여기 둔다.
 */

/** 사용자가 인증 문자를 보내는 옥토모 대표번호 */
export const OCTOMO_RECEIVER_NUMBER = '1666-3538';

/** 인증 문자를 기다리는 시간(초) */
export const MO_VALID_SECONDS = 180;

/**
 * 수신 조회 간격(ms). OCTOMO 속도 제한이 10초당 100회라 한참 여유가 있고,
 * 유효시간 3분 동안 한 번의 인증에 최대 60회를 쓴다.
 */
export const MO_POLL_INTERVAL_MS = 3000;

/**
 * 조회 범위(분). 문서 기본값이 5분이고 최대 60분이다.
 * 유효시간보다 넉넉해야 마지막에 도착한 문자를 놓치지 않는다.
 */
export const MO_WITHIN_MINUTES = 5;
