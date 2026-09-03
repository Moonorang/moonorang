'use client';

import { useEffect, useState } from 'react';

import { getJoinAvailability } from '@/features/join/server/actions';

import type { JoinKind } from '@/entities/join/types';

/**
 * 'checking'      - 아직 서버에 물어보는 중
 * 'available'     - 신청할 수 있다 (물어볼 필요가 없는 경우도 포함)
 * 'alreadyJoined' - 이미 이용 중이라 신청할 수 없다
 */
export type JoinAvailabilityState = 'checking' | 'available' | 'alreadyJoined';

interface UseJoinAvailabilityParams {
  /**
   * 상품을 JoinTarget 객체가 아니라 낱값으로 받는다 - 객체로 받으면 매 렌더 새로
   * 만들어져서, 의존성에 넣는 순간 서버에 끝없이 다시 묻게 된다.
   */
  kind: JoinKind;
  itemId: number;
  /** 아직 확인 중이면 undefined */
  isLoggedIn?: boolean;
  /** 이 카드로 방금 마친 절차인지 */
  isCompleted: boolean;
}

/**
 * COMMON-004: 이미 이용 중인 상품인지 카드를 여는 자리에서 미리 확인한다.
 *
 * 확정 단계에서도 서버가 같은 확인을 하지만(completeXxxJoin), 거기서 막으면 약관까지
 * 다 읽고 나서야 헛걸음이었음을 알게 된다 - 로그인 안내를 첫 단계로 옮긴 것과 같은
 * 이유로 여기서도 미리 알린다.
 *
 * 물어볼 필요가 없는 두 경우는 곧바로 'available' 로 둔다:
 * - 비회원(또는 확인 중): 신청 자체가 막혀 있고 그 안내는 카드가 따로 한다
 * - 이미 이 카드로 마친 절차: '이용 중'인 게 당연하고, 그 사실은 완료 상태가 말해준다
 */
export function useJoinAvailability({
  kind,
  itemId,
  isLoggedIn,
  isCompleted,
}: UseJoinAvailabilityParams): JoinAvailabilityState {
  // 서버가 답해준 것만 상태로 든다. 물어볼 필요가 없는 경우는 늘 'available' 이라
  // 저장할 것이 아니라 아래에서 파생시킨다.
  const [answer, setAnswer] = useState<JoinAvailabilityState>('checking');

  const isSkipped = isLoggedIn !== true || isCompleted;

  useEffect(() => {
    if (isSkipped) return;

    // 답이 늦게 오는 사이에 카드가 사라지거나 다른 상품으로 바뀌면 그 답은 버린다
    let isStale = false;

    void getJoinAvailability({ kind, itemId })
      .then(({ isAlreadyJoined }) => {
        if (isStale) return;

        setAnswer(isAlreadyJoined ? 'alreadyJoined' : 'available');
      })
      .catch((error: unknown) => {
        // 여기서 막아설 일은 아니다 - 못 물어봤으면 평소대로 절차를 열어주고,
        // 실제 판정은 확정 단계의 서버와 DB 제약이 한다
        console.error('[join] 이용 중 여부 확인 실패', error);

        if (!isStale) setAnswer('available');
      });

    return () => {
      isStale = true;
    };
  }, [kind, itemId, isSkipped]);

  return isSkipped ? 'available' : answer;
}
