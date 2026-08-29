// 로그인 후 돌아갈 경로(next)를 안전한 값으로 정규화한다.
// 외부 도메인으로 튕기지 않도록 앱 내부 경로만 허용한다(//evil.com 형태 차단).
export function resolveNextPath(next?: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';

  return next;
}
