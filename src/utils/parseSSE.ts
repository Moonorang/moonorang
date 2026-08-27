import type { ChatStreamEvent } from '@/types/chat';

// SSE 이벤트 블록 하나를 파싱
// 형식이 안 맞으면 null -> 호출부에서 건너뛰기
export function parseSSEEvent(raw: string): ChatStreamEvent | null {
  const lines = raw.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLine = lines.find((line) => line.startsWith('data:'));

  if (!eventLine || !dataLine) return null;

  const event = eventLine.slice('event:'.length).trim();

  try {
    const data = JSON.parse(dataLine.slice('data:'.length).trim());
    return { event, data } as ChatStreamEvent;
  } catch {
    return null;
  }
}
