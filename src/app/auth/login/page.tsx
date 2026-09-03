import KakaoLoginButton from '@/features/auth/components/KakaoLoginButton';
import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-(--width-container) min-w-(--width-container-min) flex-col items-center bg-background-subtle px-4 pt-(--height-header)">
      <h1 className="mt-16 mb-8 font-display text-32">
        <span className="text-action-secondary">Moono</span>
        <span className="text-action-primary">rang</span>
      </h1>

      <KakaoLoginButton nextPath={resolveNextPath(next)} errorCode={error} />
    </div>
  );
}
