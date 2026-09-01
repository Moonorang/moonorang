import type { ChatMessage } from '@/features/chat/types';

/**
 * 완전한 턴(사용자+AI) 개수. 메시지는 항상 사용자→AI 쌍으로 쌓이므로 2로 나눈다.
 * (스트리밍 중인 마지막 AI 메시지도 자리는 이미 차 있어서 1턴으로 센다)
 */
export function countTurns(messages: ChatMessage[]): number {
  return Math.floor(messages.length / 2);
}

export interface SummarizeSelection {
  /** 이번에 요약 대상이 되는 원문 메시지들 (가장 오래된, 아직 요약 안 된 턴들) */
  turnsToSummarize: ChatMessage[];
  /** 위 메시지가 몇 턴 분량인지 - 요약 성공 후 summarizedTurnCount에 더해준다 */
  turnCount: number;
}

/**
 * chat-api-design.md §2.6 - 미요약 턴이 threshold 이상 쌓였으면, 최근 keepRecentTurns턴을
 * 제외한 나머지(가장 오래된 쪽)를 요약 대상으로 잘라 돌려준다. 아직 기준에 못 미치면 null.
 */
export function selectTurnsToSummarize(
  messages: ChatMessage[],
  summarizedTurnCount: number,
  threshold: number,
  keepRecentTurns: number,
): SummarizeSelection | null {
  const unsummarizedTurns = countTurns(messages) - summarizedTurnCount;
  if (unsummarizedTurns < threshold) return null;

  const turnCount = unsummarizedTurns - keepRecentTurns;
  if (turnCount <= 0) return null;

  const startIndex = summarizedTurnCount * 2;
  const endIndex = startIndex + turnCount * 2;

  return { turnsToSummarize: messages.slice(startIndex, endIndex), turnCount };
}

export interface PruneResult {
  messages: ChatMessage[];
  /** 몇 턴을 걷어냈는지 - summarizedTurnCount에서 같은 만큼 빼줘야 인덱스가 안 어긋난다 */
  removedTurns: number;
}

/**
 * 화면/로컬 저장에 원문으로 남기는 턴 수 상한(maxVisibleTurns)을 넘으면, 그 초과분만큼
 * 가장 오래된 턴부터 걷어낸다. 단, 아직 요약에 반영 안 된 턴은 절대 안 지운다 -
 * 그러면 그 내용이 화면에서도 LLM 컨텍스트에서도 통째로 사라지기 때문이다.
 */
export function pruneSummarizedMessages(
  messages: ChatMessage[],
  summarizedTurnCount: number,
  maxVisibleTurns: number,
): PruneResult {
  const overflowTurns = countTurns(messages) - maxVisibleTurns;
  const removedTurns = Math.max(0, Math.min(overflowTurns, summarizedTurnCount));

  if (removedTurns === 0) return { messages, removedTurns: 0 };

  return { messages: messages.slice(removedTurns * 2), removedTurns };
}
