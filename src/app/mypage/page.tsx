import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/features/auth/server';
import AddOnSummaryCard from '@/features/mypage/components/AddOnSummaryCard';
import MembershipBarcodeCard from '@/features/mypage/components/MembershipBarcodeCard';
import UsageSummaryCard from '@/features/mypage/components/UsageSummaryCard';

import { getUserActiveAddOns } from '@/entities/addOn/server/addOnRepository';
import { getUserProfile } from '@/entities/user/server/userRepository';

import { getSeoulMonth } from '@/shared/utils/getSeoulMonth';

const MYPAGE_PATH = '/mypage';

/**
 * PERSONAL-001~005: 마이페이지.
 *
 * 값은 전부 서버에서 읽어 넘긴다 - 화면이 뜬 뒤에 채우면 카드 높이가 두 번 바뀌어
 * 레이아웃이 흔들린다. 로그인하지 않았거나 추가 정보 입력을 안 마친 사용자는
 * 볼 것이 없어서 각각 로그인·회원가입으로 돌려보낸다.
 */
export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(MYPAGE_PATH)}`);
  }

  const profile = await getUserProfile(user.id);

  // 카카오 인증만 끝나고 users 레코드가 없는 상태 - 보여줄 정보 자체가 없다
  if (!profile) {
    redirect(`/auth/signup?next=${encodeURIComponent(MYPAGE_PATH)}`);
  }

  const addOns = await getUserActiveAddOns(user.id);
  const billingMonth = getSeoulMonth();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-(--width-container) min-w-(--width-container-min) flex-col gap-4 bg-background-subtle px-4 pt-(--height-header) pb-10">
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h1 className="text-16 font-semibold text-text-primary">
          {profile.name ?? '고객'}님
        </h1>
        {profile.contact && (
          <p className="text-16 font-semibold text-text-primary">
            {profile.contact}
          </p>
        )}
      </div>

      <UsageSummaryCard profile={profile} billingMonth={billingMonth} />
      <AddOnSummaryCard addOns={addOns} billingMonth={billingMonth} />
      <MembershipBarcodeCard />
    </main>
  );
}
