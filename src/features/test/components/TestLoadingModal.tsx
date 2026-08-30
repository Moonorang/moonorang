'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * 성향 검사 응답을 마친 뒤 결과 화면으로 넘어가기 전에 잠깐 뜨는 모달.
 * 열릴 때마다 처음부터 차오르도록 부모에서 조건부로 렌더한다.
 * 진행 바는 연출용이며 실제 진행률을 나타내지는 않는다.
 */
export default function TestLoadingModal() {
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgressPercent(100));
    return () => cancelAnimationFrame(frame);
  }, []);

  // COMMON-005: 모달이 떠 있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-text-primary/50 px-4"
    >
      <div className="flex w-full max-w-(--width-container) flex-col items-center gap-3 rounded-md bg-background-default p-4">
        <Image
          src="/images/test/loading-character.png"
          alt=""
          width={80}
          height={93}
          priority
        />
        <p className="text-12 text-text-primary">
          요금제 성향 검사 결과 불러오는 중
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border-default">
          <div
            className="h-full rounded-full bg-action-secondary transition-[width] duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
