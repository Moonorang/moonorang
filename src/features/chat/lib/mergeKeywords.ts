import type { ChatKeywords } from '@/features/chat/types';

/**
 * chat-api-design.md §2.5: 주요 키워드는 구간 누적이 아니라 최신값으로 덮어쓴다.
 * extracted가 이번 턴에 실제로 언급한 필드만 채워서 오므로(spread가 나머지를 보존),
 * 언급 안 된 필드는 previous 값이 그대로 남는다.
 *
 * interests만 예외다 - budget처럼 "지금 값이 뭔지"가 아니라 "그동안 뭘 알아냈는지"의
 * 목록이라, 이번 턴에 새로 언급된 게 없다고 이전 턴에 알아낸 관심사가 없었던 일이
 * 되면 안 된다. 그래서 덮어쓰지 않고 합집합(중복 제거)으로 누적한다.
 */
export function mergeKeywords(
  previous: ChatKeywords,
  extracted: ChatKeywords | null,
): ChatKeywords {
  if (!extracted) return previous;

  const merged: ChatKeywords = { ...previous, ...extracted };

  if (extracted.interests?.length) {
    merged.interests = Array.from(
      new Set([...(previous.interests ?? []), ...extracted.interests]),
    );
  }

  return merged;
}
