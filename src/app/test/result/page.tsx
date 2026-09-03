import TestResult from '@/features/test/components/TestResult';
import { getDisplayName } from '@/features/auth/lib/getDisplayName';
import { getCurrentUser } from '@/features/auth/server/currentUser';
import { getAllAddOns } from '@/entities/addOn/server';
import { getAllMembershipBrands } from '@/entities/membershipBrand/server';
import { getAllPlans } from '@/entities/plan/server';

export default async function TestResultPage() {
  /*
   * 두 feature 를 엮는 지점이라 app 레이어인 여기서 이름을 읽어 넘긴다.
   * 서버에서 읽으므로 결과 화면이 세션 조회를 기다리지 않는다.
   *
   * 요금제와 혜택 후보(멤버십 제휴 브랜드·부가서비스)도 여기서 통째로 읽어 넘긴다 -
   * 어느 유형인지는 브라우저에 저장된 검사 응답으로 정해져서 서버가 미리 알 수 없다.
   * 그래서 서버는 목록만 주고, 그중 어울리는 것을 고르는 일은
   * 화면(selectTypeBenefits)이 맡는다.
   */
  const [user, plans, brands, addOns] = await Promise.all([
    getCurrentUser(),
    getAllPlans(),
    getAllMembershipBrands(),
    getAllAddOns(),
  ]);

  return (
    <div className="min-h-dvh bg-background-subtle">
      <div className="flex flex-col gap-5 px-4 pt-(--height-header) pb-5">
        <TestResult
          displayName={getDisplayName(user)}
          plans={plans}
          brands={brands}
          addOns={addOns}
        />
      </div>
    </div>
  );
}
