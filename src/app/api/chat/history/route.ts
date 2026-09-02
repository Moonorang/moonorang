import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/server';
import { loadMemberChatHistory } from '@/features/chat/server/chatHistory';

/**
 * CHAT-012 회원판 - 회원이 화면을 벗어났다 돌아왔을 때, DB에 저장된 대화·카드를
 * 그대로 복구해서 돌려준다. 비회원은 이 엔드포인트를 안 쓰고 localStorage를 쓴다.
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const history = await loadMemberChatHistory(user.id);
    return NextResponse.json(history);
  } catch (error) {
    console.error('[api/chat/history] 조회 실패:', error);
    return NextResponse.json(
      { error: '대화 기록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
