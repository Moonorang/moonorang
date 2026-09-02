import { getPlansByIds } from '@/entities/plan/server/planRepository';
import { tryParseCardPayload } from '@/features/chat/lib/chatCard';
import {
  getActiveChat,
  getChatMessages,
  type DbChatMessage,
} from '@/features/chat/server/chatRepository';
import type { ChatKeywords, ChatMessage, PlanJoinBlock } from '@/features/chat/types';

import type { PlanJoinProgress } from '@/entities/planJoin/types';

export interface MemberChatHistory {
  messages: ChatMessage[];
  joinBlocks: PlanJoinBlock[];
  keywords: ChatKeywords;
}

interface PendingJoinMarker {
  planId: number;
  afterMessageId: string;
  /** CARD-046: 절차를 어디까지 밟았는지 */
  progress?: PlanJoinProgress;
  /** CARD-043: 결제까지 마쳤는지 */
  isCompleted?: boolean;
}

/**
 * DB 행을 화면이 바로 쓸 수 있는 모양으로 되돌린다 - chatStream.ts가 저장할 때 쓴
 * 규칙(카드 마커 행)을 그대로 반대로 읽는다.
 * - join_flow 마커: 그 앞의 "OO 요금제 가입할래" 사용자 행을 대화에서 빼서 가입
 *   카드 자리로 돌린다 (라이브 화면에서 joinBlocks가 렌더되는 방식과 동일).
 *   진행 상태·완료 여부도 이 마커에 실려 있어 그대로 되살린다.
 * - join_result/recommendation/usage_analysis 마커: 바로 앞 AI 메시지에 그대로 붙인다.
 */
function splitRows(rows: DbChatMessage[]): {
  messages: ChatMessage[];
  joinMarkers: PendingJoinMarker[];
} {
  const messages: ChatMessage[] = [];
  const joinMarkers: PendingJoinMarker[] = [];

  for (const row of rows) {
    const card = row.role === 'ai' ? tryParseCardPayload(row.content) : null;

    if (card?.type === 'join_flow') {
      messages.pop();
      const afterMessage = messages[messages.length - 1];
      if (afterMessage) {
        joinMarkers.push({
          planId: card.planId,
          afterMessageId: afterMessage.id,
          progress: card.progress,
          isCompleted: card.isCompleted,
        });
      }
      continue;
    }

    if (card?.type === 'join_result') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.isJoinResult = true;
      continue;
    }

    if (card?.type === 'recommendation') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.recommendations = card.plans;
      continue;
    }

    if (card?.type === 'usage_analysis') {
      const last = messages[messages.length - 1];
      if (last && last.role === 'ai') last.usageAnalysis = card.data;
      continue;
    }

    messages.push({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    });
  }

  return { messages, joinMarkers };
}

/**
 * CHAT-012 회원판 - 화면을 벗어났다 돌아와도, 회원은 DB에 있는 대화·카드를 그대로
 * 복구해서 보여준다. 아직 대화를 시작 안 한 회원(세션 없음)이면 빈 상태를 돌려준다.
 */
export async function loadMemberChatHistory(
  userId: string,
): Promise<MemberChatHistory> {
  const chat = await getActiveChat(userId);
  if (!chat) return { messages: [], joinBlocks: [], keywords: {} };

  const rows = await getChatMessages(chat.id);
  const { messages, joinMarkers } = splitRows(rows);

  const planIds = [...new Set(joinMarkers.map((marker) => marker.planId))];
  const plans = planIds.length > 0 ? await getPlansByIds(planIds) : [];
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  const joinBlocks = joinMarkers.reduce<PlanJoinBlock[]>((acc, marker) => {
    const plan = planById.get(marker.planId);
    if (plan) {
      acc.push({
        plan,
        afterMessageId: marker.afterMessageId,
        progress: marker.progress,
        isCompleted: marker.isCompleted,
      });
    }
    return acc;
  }, []);

  return { messages, joinBlocks, keywords: chat.keywords };
}
