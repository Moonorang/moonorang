import type { ChatCardPayload } from '@/features/chat/types';

const CARD_TYPES: ChatCardPayload['type'][] = [
  'join_flow',
  'recommendation',
  'add_on_recommendation',
  'subscription_recommendation',
  'nearby_membership',
  'usage_analysis',
];

export function serializeCardPayload(payload: ChatCardPayload): string {
  return JSON.stringify(payload);
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
    return parsed as ChatCardPayload;
  } catch {
    return null;
  }
}
