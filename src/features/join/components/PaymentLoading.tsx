'use client';

import { useEffect, useState } from 'react';

/**
 * 결제하기를 누른 뒤 가입 결과가 대화에 나오기 전까지 잠깐 뜨는 자리.
 *
 * 카드 한 장 안에서 결제 정보 화면을 대신하므로, 높이를 그 화면과 비슷하게 잡아
 * 바뀌는 순간에 카드가 튀지 않게 한다. 진행 바는 연출용이며 실제 진행률은 아니다 -
 * 성향 검사의 TestLoadingModal 과 같은 방식으로 그린다.
 */
export default function PaymentLoading() {
  // 1. 상태 및 훅
  const [progressPercent, setProgressPercent] = useState(0);

  // 2. 부수 효과
  // 붙은 다음 프레임에 100% 로 바꿔야 transition 이 0 에서부터 차오른다
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgressPercent(100));

    return () => cancelAnimationFrame(frame);
  }, []);

  // 3. 렌더링
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-48 flex-col items-center justify-center gap-3"
    >
      <p className="text-12 text-text-primary">결제를 진행하고 있습니다</p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-border-default">
        <div
          className="h-full rounded-full bg-action-secondary transition-[width] duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
