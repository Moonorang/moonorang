'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { setPendingChatMessage } from '@/entities/chat';
import type { AddOn } from '@/entities/addOn/types';

/**
 * 부가서비스 상세 모달의 열림 상태와, 거기서 가입으로 넘어가는 규칙.
 * 요금제(usePlanDetail)와 같은 방식으로, 사용자가 직접 물어본 것처럼 채팅을 열어준다.
 */
export function useAddOnDetail() {
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const router = useRouter();

  const openAddOnDetail = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
  };

  const closeAddOnDetail = () => {
    setSelectedAddOn(null);
  };

  const goToJoin = (addOn: AddOn) => {
    // 추천 질문 칩과 같은 말투로 맞춘다 - 사용자가 직접 친 것처럼 보여야 한다
    setPendingChatMessage(`${addOn.title} 부가서비스 가입할래`);
    router.push('/');
  };

  return { selectedAddOn, openAddOnDetail, closeAddOnDetail, goToJoin };
}
