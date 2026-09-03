'use client';

import { useEffect } from 'react';

import Button from '@/shared/ui/Button';

interface CatalogErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// COMMON-002: 조회 실패 사유와 재시도 수단을 함께 제공한다.
export default function CatalogError({ error, retry }: CatalogErrorProps) {
  // 1. 부수 효과
  useEffect(() => {
    console.error('[catalog] 상품 목록 조회 실패:', error);
  }, [error]);

  // 2. 렌더링
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-(--width-container) flex-col bg-background-subtle pt-(--height-header) pb-10">
      <div className="mx-4 mt-4 flex flex-col items-center gap-3 rounded-lg bg-background-default px-4 py-10 text-center">
        <p className="text-14 font-medium text-text-primary">
          상품 정보를 불러오지 못했어요.
        </p>
        <p className="text-12 text-text-secondary">
          네트워크 상태를 확인한 뒤 다시 시도해 주세요.
        </p>
        <Button variant="main" radius="full" onClick={() => retry()}>
          다시 시도
        </Button>
      </div>
    </main>
  );
}
