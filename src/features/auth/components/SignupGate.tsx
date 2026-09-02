'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import SignupForm from '@/features/auth/components/SignupForm';
import {
  formatContact,
  fromIsoBirth,
} from '@/features/auth/lib/formatUserInput';
import { submitJoinFlowSignup } from '@/features/auth/server/actions';
import type { PlanOption } from '@/entities/plan/types';
import {
  clearSignupPrefill,
  loadSignupPrefill,
} from '@/entities/user/lib/signupPrefill';

interface SignupGateProps {
  plans: PlanOption[];
  /** 카카오 닉네임 (이름 입력 초기값) */
  defaultName: string;
  /** 가입 완료 후 이동할 경로 */
  nextPath: string;
}

/**
 * AUTH-008 / CARD-044: 추가 정보 화면을 보여줄지, 건너뛸지 가르는 자리.
 *
 * 요금제 가입 절차의 본인 확인에서 이미 이름·연락처·생년월일·성별을 다 받았고,
 * 추가 정보 화면에 남는 항목인 "현재 이용 요금제"는 지금 첫 요금제를 가입하는
 * 중이라 존재하지 않는 값이다 - 그래서 물어볼 것이 하나도 없다. 그대로 회원
 * 정보를 만들고 원래 있던 자리(가입 카드)로 돌려보낸다.
 *
 * 서버 컴포넌트(page.tsx)에서 가를 수 없어 여기서 가른다 - 넘겨받은 값이
 * sessionStorage 에 있어서 서버가 읽을 수 없기 때문이다.
 *
 * 헤더 로그인으로 들어온 사용자는 넘겨받은 값이 없으므로 늘 화면을 본다(AUTH-006).
 */
export default function SignupGate({
  plans,
  defaultName,
  nextPath,
}: SignupGateProps) {
  // 1. 상태 및 훅
  const router = useRouter();
  // 넘겨받은 값을 확인하기 전까지는 어느 쪽도 그리지 않는다 - 곧 건너뛸 화면을
  // 한 번 보여줬다 지우면 깜빡이기 때문이다
  const [isFormVisible, setIsFormVisible] = useState(false);
  const hasCheckedRef = useRef(false);

  // 2. 부수 효과
  useEffect(() => {
    // 서버 액션이 두 번 불리지 않도록 - 회원 정보를 만드는 일이라 한 번이면 된다
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const prefill = loadSignupPrefill();

    /* eslint-disable react-hooks/set-state-in-effect --
       sessionStorage 는 서버에서 읽을 수 없어 첫 렌더에는 알 수 없다. 외부 저장소를
       딱 한 번 읽어와 동기화하는 것으로, 이 규칙이 막으려는 "반복 렌더로 이어지는
       setState"가 아니다 (useChat 의 하이드레이션과 같은 상황). */

    // 이름·연락처가 없으면 건너뛸 수 없다 - 가입 절차를 이어가기(CARD-046)로
    // 재개한 경우가 그렇다. 그때는 평소대로 화면에서 입력받는다.
    if (!prefill?.name || !prefill.mobileNum) {
      setIsFormVisible(true);
      return;
    }

    void submitJoinFlowSignup({
      name: prefill.name,
      contact: formatContact(prefill.mobileNum),
      birth: prefill.birth ? fromIsoBirth(prefill.birth) : '',
      gender: prefill.gender ?? '',
    }).then(({ errorMessage }) => {
      // COMMON-002: 저장에 실패하면 조용히 멈추지 않고 평소 화면으로 되돌린다 -
      // 사용자가 직접 채워 다시 시도할 수 있는 자리가 그곳이다.
      if (errorMessage) {
        setIsFormVisible(true);
        return;
      }

      // 회원 정보에 들어간 뒤로는 브라우저에 남아 있을 이유가 없다
      clearSignupPrefill();

      router.replace(nextPath);
      router.refresh();
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, nextPath]);

  // 3. 렌더링
  if (!isFormVisible) {
    return (
      <p
        role="status"
        className="py-10 text-center text-14 text-text-secondary"
      >
        가입 정보를 확인하고 있어요...
      </p>
    );
  }

  return (
    <SignupForm plans={plans} defaultName={defaultName} nextPath={nextPath} />
  );
}
