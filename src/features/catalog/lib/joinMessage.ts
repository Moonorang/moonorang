import type { AddOn } from '@/entities/addOn/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';

/*
 * 상세에서 가입을 누르면 채팅에 대신 남길 문장.
 * 사용자가 직접 친 것처럼 보여야 해서 추천 질문 칩(SuggestionChips)과 같은 말투로 맞춘다.
 * 항목이 늘어나면(멤버십) 여기에 한 줄씩 추가한다.
 */

export function buildPlanJoinMessage(plan: Plan): string {
  return `${plan.name} 요금제 가입할래`;
}

export function buildAddOnJoinMessage(addOn: AddOn): string {
  return `${addOn.title} 부가서비스 가입할래`;
}

export function buildSubscriptionJoinMessage(
  subscription: Subscription,
): string {
  return `${subscription.name} 구독 가입할래`;
}
