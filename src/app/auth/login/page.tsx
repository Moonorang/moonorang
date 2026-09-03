import KakaoLoginButton from '@/features/auth/components/KakaoLoginButton';
import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-full max-w-(--width-container) flex-col items-center px-4 pt-(--height-header)">
      {/* 회원가입 화면·관심사 화면과 같은 워드마크 - 로고를 화면마다 다른 크기로
          쓰면 같은 흐름 안에서 서비스 이름이 커졌다 작아졌다 해서 크기도 맞춘다 */}
      <h1 className="mt-16 mb-8 font-display text-32">
        <span className="text-action-secondary">Moono</span>
        <span className="text-action-primary">rang</span>
      </h1>

      <KakaoLoginButton nextPath={resolveNextPath(next)} errorCode={error} />
    </div>
  );
}
