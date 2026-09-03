import type { JoinItem } from '@/entities/join/types';

// 다른 화면에서 채팅으로 넘길 때 실어 보내는 메시지의 sessionStorage 키.
// 탭 하나 안에서만, 넘어가는 그 순간에만 쓰는 값이라 localStorage 가 아니다.
const PENDING_MESSAGE_KEY = 'moonorang:pendingChatMessage';

export interface PendingChatMessage {
  /** 대화에 남길 문장 */
  text: string;
  /**
   * 있으면 이 문장을 모델에 보내는 대신 곧바로 가입 카드를 연다.
   *
   * 문장만 보내면 모델이 무엇을 하라는 말인지 다시 판단해야 해서, 이미 상세에서
   * 고른 상품인데도 몇 초를 기다렸다가 추천 카드를 다시 받아 한 번 더 눌러야 한다.
   * 문장은 화면에 보일 말이고, 무엇을 할지는 이 값이 정한다.
   */
  join?: JoinItem;
}

/**
 * 목록 등 채팅 밖 화면에서 "이 말로 대화를 시작해달라"고 남겨두는 자리.
 *
 * 쿼리 파라미터로 넘기지 않는 이유는, 넘긴 값이 곧바로 사용자 메시지로 확정되는데
 * URL 에는 계속 남아서 새로고침할 때마다 같은 말이 다시 전송되기 때문이다.
 * 여기서는 읽는 쪽이 꺼내면서 지우므로(take) 어떤 경우에도 한 번만 나간다.
 *
 * sessionStorage 는 프라이빗 모드 등에서 막힐 수 있는데, 그때는 자동 전송만
 * 안 될 뿐 채팅 자체는 정상 동작해야 해서 실패를 조용히 무시한다
 * (features/chat 의 chatStorage 와 같은 취지).
 */
export function setPendingChatMessage(pending: PendingChatMessage): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(PENDING_MESSAGE_KEY, JSON.stringify(pending));
  } catch {
    // 저장 실패 - 채팅은 빈 상태로 열릴 뿐 대화엔 지장 없음
  }
}

/** 남겨둔 메시지를 꺼내면서 지운다. 없으면 null. */
export function takePendingChatMessage(): PendingChatMessage | null {
  if (typeof window === 'undefined') return null;

  let raw: string | null = null;

  try {
    raw = window.sessionStorage.getItem(PENDING_MESSAGE_KEY);
    if (!raw) return null;

    window.sessionStorage.removeItem(PENDING_MESSAGE_KEY);
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingChatMessage> | null;
    if (!parsed || typeof parsed.text !== 'string') return null;

    return { text: parsed.text, join: parsed.join };
  } catch {
    // 이 값이 문장 하나였던 시절에 남겨진 것 - 탭을 닫기 전에 배포가 바뀌면
    // 예전 모양이 남아 있을 수 있다. 그때는 문장만 있는 것으로 읽는다.
    return { text: raw };
  }
}
