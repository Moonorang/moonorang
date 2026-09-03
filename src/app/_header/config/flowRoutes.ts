// 가입·로그인 흐름처럼 이탈을 막아야 하는 화면.
// 여기 해당하면 헤더가 로고·우측 항목 대신 나가기 버튼만 노출한다.
export const FLOW_ROUTES: string[] = ['/auth/signup', '/auth/login'];

// FLOW_ROUTES 중 나가기가 '직전 화면'으로 돌아가는 화면.
// 나머지는 홈으로 보낸다 — 카카오 인증을 거쳐 들어온 화면은 히스토리에 외부 인증 페이지가
// 껴 있어, 히스토리를 되감으면 인증 화면으로 돌아가 버리기 때문이다.
export const HISTORY_BACK_ROUTES: string[] = ['/auth/login'];

// 나가려면 확인을 받고, 나갈 때 인증 세션까지 정리해야 하는 화면.
// 카카오 인증만 끝나고 users 레코드가 없는 '반쪽 상태'로 앱을 돌아다니지 않도록,
// 몰래 빠져나가는 문 대신 명시적으로 그만두는 문만 둔다(AUTH-004).
export const SIGNOUT_EXIT_ROUTES: string[] = ['/auth/signup'];

// 로그인해야만 볼 수 있는 화면(PERSONAL-001~002).
// 이 화면에서 로그아웃하면 볼 권한이 사라지므로 홈으로 내보낸다.
export const AUTH_REQUIRED_ROUTES: string[] = ['/mypage'];
