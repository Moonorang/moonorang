import type { AddOn } from '@/entities/addOn/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';

/*
 * 가입 카드와 함께 대화에 남기는 사용자 말풍선 문구.
 *
 * 두 자리에서 쓰인다 - 목록 상세에서 "채팅에서 가입하기"로 넘어올 때 실제로
 * 보내는 문장이고, 채팅 안에서 신청하기를 눌러 카드를 띄울 때 그 위에 그리는
 * 말풍선이기도 하다. 두 경로가 같은 말을 해야 해서 여기 한 곳에 모아둔다.
 *
 * 사용자가 직접 친 것처럼 보여야 해서 추천 질문 칩(SuggestionChips)과 같은 말투로 맞춘다.
 * features/catalog 와 features/chat 이 함께 쓰므로 entities 에 둔다.
 */

export function buildPlanJoinMessage(plan: Pick<Plan, 'name'>): string {
  return `${plan.name} 요금제 가입할래`;
}

export function buildAddOnJoinMessage(addOn: Pick<AddOn, 'title'>): string {
  return `${addOn.title} 부가서비스 가입할래`;
}

export function buildSubscriptionJoinMessage(
  subscription: Pick<Subscription, 'name'>,
): string {
  return `${subscription.name} 구독 가입할래`;
}
