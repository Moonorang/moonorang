import {
  buildAddOnJoinMessage,
  buildPlanJoinMessage,
  buildSubscriptionJoinMessage,
  getJoinKey,
} from '@/entities/join';
import type { JoinTarget } from '@/entities/join/types';

import type { JoinBlock } from '@/features/chat/types';

/**
 * 가입 카드 한 장이 가리키는 상품.
 * 블록은 상품 값을 통째로 들고 있어서 종류와 번호는 여기서 꺼내 쓴다 -
 * 같은 값을 필드로 또 갖고 있으면 둘이 어긋날 수 있다.
 */
export function getJoinBlockTarget(block: JoinBlock): JoinTarget {
  return { kind: block.kind, itemId: block.item.id };
}

/**
 * 카드 위에 그리는 사용자 말풍선 문구.
 * 목록 상세에서 넘어올 때 실제로 보내는 문장과 같아야 해서(entities/join),
 * 종류별로 그 빌더를 그대로 부른다.
 */
export function getJoinBlockMessage(block: JoinBlock): string {
  switch (block.kind) {
    case 'plan':
      return buildPlanJoinMessage(block.item);
    case 'addOn':
      return buildAddOnJoinMessage(block.item);
    case 'subscription':
      return buildSubscriptionJoinMessage(block.item);
  }
}

/**
 * 같은 상품을 가리키는 카드는 대화에 한 장만 남긴다. 겹치면 나중 것을 살린다 -
 * 가장 최근 시도가 지금 진행 중인 카드이고, 서버의 updateJoinFlowMarker 도
 * "같은 상품으로 여러 번 신청한 흔적이 있으면 가장 최근 것을 고친다"로 맞춰져 있다.
 *
 * addJoinBlock 이 이미 이 규칙을 지키지만 그건 이번 화면에서 띄운 카드만이다.
 * 회원 대화를 복구하거나 비회원 대화를 승계할 때는 서로 다른 출처의 카드가 합쳐져서
 * 같은 상품이 두 장 나올 수 있다 - 로그인해서 가입한 뒤 로그아웃하고 같은 상품을
 * 다시 열면 정확히 그 모양이 된다.
 *
 * 두 장이 되면 화면이 멈춘다. React key(getJoinKey)가 겹치는 데다, 두 카드가
 * 저마다 다른 진행 상태를 같은 자리에 번갈아 덮어써서 갱신이 끝나지 않는다.
 * 그래서 이 규칙은 편의가 아니라 목록을 만드는 모든 자리가 지켜야 하는 약속이다.
 */
export function dedupeJoinBlocks(blocks: JoinBlock[]): JoinBlock[] {
  const byKey = new Map<string, JoinBlock>();

  for (const block of blocks) {
    const key = getJoinKey(getJoinBlockTarget(block));
    // 지웠다 다시 넣어서 값뿐 아니라 순서도 나중 것을 따르게 한다
    byKey.delete(key);
    byKey.set(key, block);
  }

  return [...byKey.values()];
}
