/**
 * 플로팅 버튼을 숨기는 화면.
 * - 채팅 화면 자체(정확히 일치할 때만 - '/'로 시작하는 모든 경로가 걸리면 안 되므로 startsWith 대상엔 안 넣는다)
 * - 로그인/회원가입처럼, "채팅으로 돌아가기"로 이탈을 유도하면 안 되는 화면
 */
export const EXACT_HIDDEN_ROUTES: string[] = ['/'];
export const HIDDEN_ROUTE_PREFIXES: string[] = ['/auth/login', '/auth/signup'];

export function isFloatingChatButtonHidden(pathname: string): boolean {
  return (
    EXACT_HIDDEN_ROUTES.includes(pathname) ||
    HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
