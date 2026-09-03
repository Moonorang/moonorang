import { NextResponse } from 'next/server';

import { parseChatSummarizeRequest } from '@/features/chat/lib/schema';
import { summarizeConversation } from '@/features/chat/server/summarizeConversation';

/**
 * chat-api-design.md §2.6 - 오래된 대화 구간을 압축 요약한다.
 * 응답 스트리밍이 끝난 뒤 클라이언트가 비동기로(await 없이) 호출하므로, 여기서도
 * 스트리밍은 필요 없다 - 완료된 요약 텍스트 하나만 돌려준다.
 */
export async function POST(request: Request) {
  const parsed = parseChatSummarizeRequest(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  try {
    const summary = await summarizeConversation(
      parsed.data.messages,
      parsed.data.existingSummary,
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[api/chat/summarize] 요약 실패:', error);
    // 요약은 대화 흐름을 막으면 안 되는 부가 기능이라(NFR-006과 같은 취지),
    // 실패해도 클라이언트는 기존 요약을 그대로 쓰고 다음 트리거 때 다시 시도한다.
    return NextResponse.json({ error: '요약 생성에 실패했습니다.' }, { status: 502 });
  }
}
