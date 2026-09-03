import { buildAddOnJoinMessage, buildPlanJoinMessage } from '@/entities/join';
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
  }
}
