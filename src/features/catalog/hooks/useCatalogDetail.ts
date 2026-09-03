'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { setPendingChatMessage } from '@/entities/chat';
import type { JoinItem } from '@/entities/join/types';

/**
 * 목록에서 항목 하나를 골라 상세를 띄우고, 거기서 가입으로 넘어가는 규칙.
 * 요금제·부가서비스·구독·멤버십이 이 규칙을 그대로 공유하고, 항목마다 다른 것은
 * 채팅에 남길 문장 하나뿐이라 그것만 buildJoinMessage 로 받는다.
 *
 * 가입 절차는 채팅 안에서 진행하므로(CARD-029) 목록에서는 가입 화면을 직접 띄우지 않고,
 * 사용자가 그 항목을 물어본 것처럼 채팅을 열어준다. 이렇게 하면 이어지는 대화가
 * 그 항목을 문맥으로 물고 갈 수 있다 - features/join 을 직접 부르지 않는 이유이기도 하다.
 *
 * toJoinItem 을 넘기면 그 문장을 모델에 보내는 대신 채팅이 곧바로 가입 카드를 연다.
 * 안 넘기면 문장만 보내서 평소처럼 모델이 답한다 - 아직 가입 카드가 없는 종류가
 * 그렇다(부가서비스·구독).
 *
 * 가입 대상이 아닌 항목은 buildJoinMessage 를 넘기지 않는다 - 멤버십은 제휴 할인처
 * 정보라 가입이라는 동작 자체가 없고, 상세를 열고 닫는 부분만 이 훅을 쓴다.
 */
export function useCatalogDetail<T>(
  buildJoinMessage?: (item: T) => string,
  toJoinItem?: (item: T) => JoinItem,
) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const router = useRouter();

  const openDetail = (item: T) => {
    setSelectedItem(item);
  };

  const closeDetail = () => {
    setSelectedItem(null);
  };

  const goToJoin = (item: T) => {
    // 가입 대상이 아닌 항목(멤버십)은 이 함수를 쓰지 않는다
    if (!buildJoinMessage) return;

    setPendingChatMessage({
      text: buildJoinMessage(item),
      join: toJoinItem?.(item),
    });
    router.push('/');
  };

  return { selectedItem, openDetail, closeDetail, goToJoin };
}
