import { redirect } from 'next/navigation';

import SignupForm from '@/components/auth/SignupForm';

import { createClient } from '@/lib/supabase/server';
import type { PlanOption } from '@/types/plan';

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

// 카카오에서 받은 닉네임을 이름 초기값으로 사용
function getKakaoNickname(metadata: Record<string, unknown>): string {
  const candidates = [
    metadata.name,
    metadata.full_name,
    metadata.preferred_username,
  ];
  const nickname = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== '',
  );

  return typeof nickname === 'string' ? nickname : '';
}

// 외부 도메인으로 튕기지 않도록 앱 내부 경로만 허용
function resolveNextPath(next?: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';

  return next;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = resolveNextPath(next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증 없이 직접 진입한 경우 로그인부터(PERSONAL-002와 동일한 처리)
  if (!user) redirect('/auth/login');

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  // 이미 가입을 마친 회원은 추가 정보 입력 없이 통과(AUTH-005)
  if (existingUser) redirect(nextPath);

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name')
    .order('monthly_fee')
    .returns<PlanOption[]>();

  return (
    <main className="mx-auto flex w-full max-w-(--width-container) flex-col px-4 pt-(--height-header) pb-10">
      <h1 className="flex flex-col gap-5 pt-6 text-center text-16 font-medium text-text-main">
        <span className="block font-display text-32">
          <span className="text-primary-yellow">Moono</span>
          <span className="text-primary-red">rang</span>
        </span>
        <span>무너랑에 오신 걸 환영해요! ✨</span>
      </h1>
      <p className="mt-2 text-center text-14 leading-relaxed text-text-main">
        무너가 나에게 꼭 맞는 데이터와 혜택을 쏙쏙 골라드릴게요.
        <br />
        아래 정보를 알려주시면 상담이 더 정확해져요!
      </p>

      <div className="mt-5">
        <SignupForm
          plans={plans ?? []}
          defaultName={getKakaoNickname(user.user_metadata)}
          nextPath={nextPath}
        />
      </div>
    </main>
  );
}
