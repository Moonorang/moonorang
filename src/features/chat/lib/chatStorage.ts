import { isJoinKind } from '@/entities/join';
import { dedupeJoinBlocks } from '@/features/chat/lib/joinBlock';
import type { Plan } from '@/entities/plan/types';

import { CHAT_STORAGE_KEY } from '@/features/chat/constants';
import type {
  ChatKeywords,
  ChatMessage,
  JoinBlock,
} from '@/features/chat/types';

export interface StoredChatState {
  messages: ChatMessage[];
  /** 오래된 대화 압축 요약 - 화면엔 안 보이고 다음 요청의 시스템 프롬프트에만 실린다 */
  summary: string;
  /** messages 중 앞에서부터 몇 턴이 이미 summary에 반영됐는지 */
  summarizedTurnCount: number;
  keywords: ChatKeywords;
  /** CARD-029: 대화 중간에 띄운 가입 카드들 - 메시지와 같이 복구해야 순서가 유지된다 */
  joinBlocks: JoinBlock[];
}

/** 요금제만 가입할 수 있던 시절에 저장된 가입 카드의 모양 */
type LegacyJoinBlock = Omit<JoinBlock, 'kind' | 'item'> & { plan: Plan };

/**
 * 예전 브라우저 저장분의 가입 카드를 지금 모양으로 맞춘다.
 * 서버 쪽 chatCard.ts 의 normalizeCardPayload 와 같은 취지 - 읽는 자리에서
 * 흡수해서, 위쪽은 kind 가 늘 있다고 믿고 쓰게 한다.
 */
function normalizeJoinBlock(stored: unknown): JoinBlock | null {
  if (!stored || typeof stored !== 'object') return null;

  const block = stored as Partial<JoinBlock> & Partial<LegacyJoinBlock>;

  // 종류를 여기 적어두지 않고 entities/join 의 목록으로 가린다 - 예전에 'plan' 만
  // 통과시키도록 적어뒀다가 부가서비스·구독을 더할 때 같이 못 고쳐서, 비회원이
  // 띄운 그 카드들이 복구 때마다 조용히 사라진 적이 있다.
  if (isJoinKind(block.kind) && block.item) {
    return block as JoinBlock;
  }

  // kind 가 없고 plan 을 들고 있으면 예전 모양이다
  if (!block.kind && block.plan) {
    const { plan, ...rest } = block as LegacyJoinBlock;

    return { ...rest, kind: 'plan', item: plan };
  }

  // 그래도 모르겠는 모양은 버린다 - 그릴 방법이 없는 카드를 들고 있어봐야
  // 저장분에만 남는다
  return null;
}

/**
 * CHAT-011/012: 비회원 대화를 서버 DB가 아니라 브라우저에만 저장하고, 다른 화면에
 * 갔다 돌아와도 복구한다. localStorage는 프라이빗 모드·용량 초과 등으로 언제든
 * 실패할 수 있어서, 실패해도 대화 자체는 안 막히게 전부 조용히 무시한다 -
 * 저장/복구가 안 될 뿐 채팅 기능엔 지장이 없어야 한다(NFR-006과 같은 취지).
 */
export function saveChatState(state: StoredChatState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패 - 다음 방문 때 복구가 안 될 뿐, 지금 대화엔 지장 없음
  }
}

export function loadChatState(): StoredChatState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredChatState> | null;
    if (!parsed || !Array.isArray(parsed.messages)) return null;

    return {
      messages: parsed.messages,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      summarizedTurnCount:
        typeof parsed.summarizedTurnCount === 'number'
          ? parsed.summarizedTurnCount
          : 0,
      keywords:
        parsed.keywords && typeof parsed.keywords === 'object'
          ? parsed.keywords
          : {},
      // 이 필드가 없던 시절에 저장된 값도 그대로 복구돼야 한다 - 없으면 빈 배열
      // 같은 상품 카드가 두 장이면 화면이 멈춘다(dedupeJoinBlocks 주석 참고) -
      // 저장분이 예전 버전에서 왔거나 손상됐을 수 있어 읽는 자리에서도 지킨다
      joinBlocks: Array.isArray(parsed.joinBlocks)
        ? dedupeJoinBlocks(
            parsed.joinBlocks
              .map(normalizeJoinBlock)
              .filter((block): block is JoinBlock => block !== null),
          )
        : [],
    };
  } catch {
    return null;
  }
}

/** CHAT-014: 대화 초기화 시 로컬 저장분도 같이 지운다 */
export function clearChatState(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // 무시
  }
}
