import KakaoLoginButton from '@/features/auth/components/KakaoLoginButton';
import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-full max-w-(--width-container) flex-col items-center px-4 pt-(--height-header)">
      <h1 className="mt-16 text-32 font-bold text-text-primary">로그인</h1>

      <KakaoLoginButton
        nextPath={resolveNextPath(next)}
        errorCode={error}
        appendClassName="mt-8"
      />
    </div>
  );
}
