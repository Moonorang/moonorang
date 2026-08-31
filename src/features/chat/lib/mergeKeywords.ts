import type { ChatKeywords } from '@/features/chat/types';

/**
 * chat-api-design.md §2.5: 주요 키워드는 구간 누적이 아니라 최신값으로 덮어쓴다.
 * extracted가 이번 턴에 실제로 언급한 필드만 채워서 오므로(spread가 나머지를 보존),
 * 언급 안 된 필드는 previous 값이 그대로 남는다.
 */
export function mergeKeywords(
  previous: ChatKeywords,
  extracted: ChatKeywords | null,
): ChatKeywords {
  if (!extracted) return previous;

  return { ...previous, ...extracted };
}
