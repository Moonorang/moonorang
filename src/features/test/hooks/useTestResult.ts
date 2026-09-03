'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { diagnoseLeisureType } from '@/features/test/lib/diagnose';
import { saveTestResult } from '@/features/test/server/actions';
import { useTestStore } from '@/features/test/store/testStore';

/**
 * 결과 화면이 필요로 하는 값과 동작을 한곳에서 만든다.
 * 응답 없이 직접 들어온 경우의 되돌리기까지 여기서 처리하고,
 * ui 는 hasAnswer 만 보고 그릴지 말지 정한다.
 */
export function useTestResult() {
  // 1. 상태 및 훅
  const router = useRouter();
  const { answers, resetTest } = useTestStore();

  // TEST-006: 순수 함수라 같은 응답이면 항상 같은 유형이 나온다.
  const result = useMemo(() => diagnoseLeisureType(answers), [answers]);

  const hasAnswer = answers.some((answer) => answer !== null);

  // 결과 한 번에 한 번만 저장한다 - 다시 그려질 때마다 로그가 쌓이면 안 된다
  const hasSavedRef = useRef(false);

  // 2. 부수 효과
  useEffect(() => {
    // 응답 없이 직접 들어온 경우(새로고침 등)는 채팅으로 돌려보낸다.
    if (!hasAnswer) {
      router.replace('/');
      return;
    }

    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    // TEST-010: 로그인 사용자면 활동 로그에 남는다. 비회원이면 그냥 지나간다.
    // 저장 여부와 무관하게 결과 화면은 그대로 보여준다 - 저장은 곁가지다.
    void saveTestResult({
      typeId: result.type.id,
      typeName: result.type.name,
      keywords: result.keywords,
    });
  }, [hasAnswer, result, router]);

  // 3. 이벤트 핸들러
  const retryTest = () => {
    resetTest();
    router.push('/');
  };

  const shareResult = () => {
    // TEST-012: 공유 API 를 못 쓰는 브라우저에서는 링크 복사로 대신한다.
    if (navigator.share) {
      void navigator.share({
        title: '무너랑 취미 성향 검사',
        text: `내 취미 성향은 "${result.type.name}"!`,
        url: window.location.href,
      });
      return;
    }

    void navigator.clipboard.writeText(window.location.href);
  };

  return { hasAnswer, result, retryTest, shareResult };
}
