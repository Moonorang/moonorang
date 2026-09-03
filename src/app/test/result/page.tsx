import TestResult from '@/features/test/components/TestResult';
import { getDisplayName } from '@/features/auth/lib/getDisplayName';
import { getCurrentUser } from '@/features/auth/server/currentUser';

export default async function TestResultPage() {
  // 두 feature 를 엮는 지점이라 app 레이어인 여기서 이름을 읽어 넘긴다.
  // 서버에서 읽으므로 결과 화면이 세션 조회를 기다리지 않는다.
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-background-subtle">
      <div className="flex flex-col gap-5 px-4 pt-(--height-header) pb-5">
        <TestResult displayName={getDisplayName(user)} />
      </div>
    </div>
  );
}
