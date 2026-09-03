/**
 * 플로팅 버튼을 숨기는 화면.
 * - 채팅 화면 자체(정확히 일치할 때만 - '/'로 시작하는 모든 경로가 걸리면 안 되므로 startsWith 대상엔 안 넣는다)
 * - 로그인/회원가입처럼, "채팅으로 돌아가기"로 이탈을 유도하면 안 되는 화면
 * - 취미 성향 검사 결과처럼, 한 화면에 딱 맞춰 그리는 화면(버튼이 아래 내용을 가린다)
 */
export const EXACT_HIDDEN_ROUTES: string[] = ['/'];
export const HIDDEN_ROUTE_PREFIXES: string[] = [
  '/auth/login',
  '/auth/signup',
  '/test/result',
];

export function isFloatingChatButtonHidden(pathname: string): boolean {
  return (
    EXACT_HIDDEN_ROUTES.includes(pathname) ||
    HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
