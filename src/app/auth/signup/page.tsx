import { redirect } from 'next/navigation';

import SignupGate from '@/features/auth/components/SignupGate';

import { getKakaoNickname } from '@/features/auth/lib/getKakaoNickname';
import { resolveNextPath } from '@/features/auth/lib/resolveNextPath';
import {
  getCurrentUser,
  hasUserProfile,
} from '@/features/auth/server/currentUser';
import { getPlanOptions } from '@/entities/plan/server/planRepository';

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = resolveNextPath(next);

  const user = await getCurrentUser();

  // 인증 없이 직접 진입한 경우 로그인부터(PERSONAL-002와 동일한 처리).
  // 원래 가려던 곳은 next 로 넘겨 로그인 후 이어지게 한다(AUTH-014).
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  // 이미 가입을 마친 회원은 추가 정보 입력 없이 통과(AUTH-005)
  if (await hasUserProfile(user.id)) redirect(nextPath);

  const plans = await getPlanOptions();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-(--width-container) min-w-(--width-container-min) flex-col bg-background-subtle px-4 pt-(--height-header) pb-10">
      <h1 className="flex flex-col gap-5 pt-6 text-center text-16 font-medium text-text-primary">
        <span className="block font-display text-32">
          <span className="text-action-secondary">Moono</span>
          <span className="text-action-primary">rang</span>
        </span>
        <span>무너랑에 오신 걸 환영해요! ✨</span>
      </h1>
      <p className="mt-2 text-center text-14 leading-relaxed text-text-primary">
        무너가 나에게 꼭 맞는 데이터와 혜택을 쏙쏙 골라드릴게요.
        <br />
        아래 정보를 알려주시면 상담이 더 정확해져요!
      </p>

      <div className="mt-5">
        {/*
          AUTH-008: 요금제 가입 절차에서 넘어온 경우엔 물어볼 것이 남지 않아
          이 화면을 건너뛴다 - 그 판단은 sessionStorage 를 읽어야 해서 클라이언트가 한다.
        */}
        <SignupGate
          plans={plans}
          defaultName={getKakaoNickname(user.user_metadata)}
          nextPath={nextPath}
        />
      </div>
    </main>
  );
}
