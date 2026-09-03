import type { ChatCardPayload } from '@/features/chat/types';

const CARD_TYPES: ChatCardPayload['type'][] = [
  'join_flow',
  'join_result',
  'recommendation',
  'add_on_recommendation',
  'subscription_recommendation',
  'nearby_membership',
  'usage_analysis',
];

/**
 * 부가서비스·구독까지 넓히기 전에 저장된 가입 마커의 모양.
 * 그때는 가입할 수 있는 것이 요금제뿐이라 종류를 남길 이유가 없었다.
 */
interface LegacyJoinFlowPayload {
  type: 'join_flow';
  planId: number;
}

export function serializeCardPayload(payload: ChatCardPayload): string {
  return JSON.stringify(payload);
}

/**
 * 예전에 저장된 행을 지금 모양으로 맞춰준다.
 *
 * 이미 DB에 쌓여 있는 대화를 되살리는 길이라, 마이그레이션 대신 읽는 자리에서
 * 흡수한다 - 여기만 통과하면 위쪽은 kind 가 늘 있다고 믿고 쓸 수 있다.
 */
function normalizeCardPayload(
  parsed: ChatCardPayload | LegacyJoinFlowPayload,
): ChatCardPayload {
  if (parsed.type === 'join_flow' && !('kind' in parsed)) {
    const { planId, ...rest } = parsed as LegacyJoinFlowPayload &
      Omit<Extract<ChatCardPayload, { type: 'join_flow' }>, 'kind' | 'itemId'>;

    return { ...rest, kind: 'plan', itemId: planId };
  }

  // 가입 결과 마커도 종류가 없던 시절이 있다 - 그때는 요금제뿐이었다
  if (parsed.type === 'join_result' && !('kind' in parsed)) {
    return { type: 'join_result', kind: 'plan' };
  }

  return parsed as ChatCardPayload;
}

/**
 * chat_messages.content가 카드 마커인지 판별한다. 일반 대화 텍스트가 우연히 이
 * 모양의 JSON일 확률은 사실상 0이라, 파싱 성공 + type이 알려진 값인지로 충분하다.
 */
export function tryParseCardPayload(content: string): ChatCardPayload | null {
  try {
    const parsed = JSON.parse(content) as Partial<ChatCardPayload> | null;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !CARD_TYPES.includes(parsed.type as ChatCardPayload['type'])
    ) {
      return null;
    }

    return normalizeCardPayload(
      parsed as ChatCardPayload | LegacyJoinFlowPayload,
    );
  } catch {
    return null;
  }
}
