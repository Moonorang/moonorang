/**
 * 카카오 인증은 끝났지만 users 레코드가 아직 없는 상태(=추가 정보 입력 미완료)를
 * 표시하는 쿠키. auth/callback 에서 심고, 가입 완료·로그아웃 시 지운다.
 *
 * 이 쿠키는 proxy 가 DB 조회 없이 값싸게 걸러내기 위한 표식일 뿐이다.
 * 사용자가 지울 수 있으므로 최종 판정은 언제나 서버(가입 페이지 가드, requireMember)가
 * users 레코드를 직접 확인해서 내린다.
 */
export const SIGNUP_PENDING_COOKIE = 'signup_pending';

export const SIGNUP_PENDING_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // 인증 직후 이어서 입력하는 값이라 오래 살려둘 이유가 없다
  maxAge: 60 * 60,
} as const;
