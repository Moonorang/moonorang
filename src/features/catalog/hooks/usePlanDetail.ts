'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { setPendingChatMessage } from '@/entities/chat';
import type { Plan } from '@/entities/plan/types';

/**
 * 요금제 상세 모달의 열림 상태와, 거기서 가입으로 넘어가는 규칙.
 *
 * 가입 절차는 채팅 안에서 진행하므로(CARD-029) 목록에서는 가입 카드를 직접 띄우지 않고,
 * 사용자가 그 요금제를 물어본 것처럼 채팅을 열어준다. 이렇게 하면 이어지는 대화가
 * 그 요금제를 문맥으로 물고 갈 수 있다 - features/join 을 직접 부르지 않는 이유이기도 하다.
 */
export function usePlanDetail() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const router = useRouter();

  const openPlanDetail = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const closePlanDetail = () => {
    setSelectedPlan(null);
  };

  const goToJoin = (plan: Plan) => {
    // 추천 질문 칩과 같은 말투로 맞춘다 - 사용자가 직접 친 것처럼 보여야 한다
    setPendingChatMessage(`${plan.name} 요금제 가입할래`);
    router.push('/');
  };

  return { selectedPlan, openPlanDetail, closePlanDetail, goToJoin };
}
