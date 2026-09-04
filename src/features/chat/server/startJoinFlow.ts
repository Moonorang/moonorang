import type { AddOn } from '@/entities/addOn/types';
import type { JoinItem } from '@/entities/join/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';
import type { StartJoinFlowArguments } from '@/features/chat/server/tools';
import type { SSESend } from '@/features/chat/lib/sse';

/**
 * CARD-029: start_join_flow가 트리거되면(=사용자가 특정 상품을 콕 집어 가입 의사를
 * 밝히면) 실제로 그 상품이 존재하는지 확인하고 카드를 연다.
 *
 * CARD-001과 같은 원칙 - LLM은 "이 id로 가입 카드를 열어달라"는 신호만 주고, 그 id가
 * 실제로 존재하는지, 상품 정보가 무엇인지는 서버가 지금 막 조회한 plans/addOns/
 * subscriptions(이번 요청 시작할 때 DB에서 가져온 값)에서 다시 확인한다. 모델이
 * 없는 id를 지어내거나 착각해도, 실제로 없는 상품이면 카드가 열리지 않는다.
 */
export function runStartJoinFlow(
  args: StartJoinFlowArguments | null,
  plans: Plan[],
  addOns: AddOn[],
  subscriptions: Subscription[],
  send: SSESend,
): unknown {
  if (!args) return { ok: false, reason: 'invalid_arguments' as const };

  let item: JoinItem | null = null;

  if (args.kind === 'plan') {
    const plan = plans.find((candidate) => candidate.id === args.itemId);
    item = plan ? { kind: 'plan', item: plan } : null;
  } else if (args.kind === 'addOn') {
    const addOn = addOns.find((candidate) => candidate.id === args.itemId);
    item = addOn ? { kind: 'addOn', item: addOn } : null;
  } else {
    const subscription = subscriptions.find(
      (candidate) => candidate.id === args.itemId,
    );
    item = subscription ? { kind: 'subscription', item: subscription } : null;
  }

  if (!item) return { ok: false, reason: 'not_found' as const };

  send({ event: 'joinFlowRequested', data: { item } });

  // 다음 턴에서 모델이 짧게 안내할 때 참고할 이름 - 카드 자체 안내문(JOIN_GUIDE)이
  // 이미 자세히 설명하므로, 여기서는 무슨 상품인지 정도만 알면 충분하다.
  const name = item.kind === 'addOn' ? item.item.title : item.item.name;
  return { ok: true, name };
}
