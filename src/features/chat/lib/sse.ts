import type { ChatStreamEvent } from '@/features/chat/types';

/**
 * SSE 와이어 포맷 (CHAT-006).
 *
 * 인코더(서버)와 디코더(클라이언트)를 한 파일에 둔다.
 * `event: …\ndata: …\n\n` 규칙을 한쪽만 고치면 조용히 깨지고,
 * 증상은 "토큰이 안 온다"로만 나타나기 때문이다.
 */

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
} as const;

export function formatSSEEvent(event: ChatStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export type SSESend = (event: ChatStreamEvent) => void;

/**
 * ReadableStream 컨트롤러에 이벤트를 써 넣는 함수를 만든다.
 * 이 덕에 스트림을 만드는 쪽은 TextEncoder 를 신경 쓰지 않는다.
 */
export function createSSESender(
  controller: ReadableStreamDefaultController,
): SSESend {
  const encoder = new TextEncoder();

  return (event) => {
    try {
      controller.enqueue(encoder.encode(formatSSEEvent(event)));
    } catch {
      // CHAT-008: 사용자가 생성을 중단하면 클라이언트가 연결을 끊고, 그 직후
      // 남은 이벤트(예: catch 블록의 error 이벤트)를 보내려 하면 컨트롤러가
      // 이미 닫혀 있어 enqueue가 던진다. 받을 상대가 없으니 조용히 무시한다.
    }
  };
}

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
