import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/server';
import { createNewChat } from '@/features/chat/server/chatRepository';

/**
 * CHAT-014: 회원이 대화를 초기화하면 새 세션을 만든다 - 이전 세션은 DB에 그대로
 * 남고, 다음 메시지부터는 이 새 세션에 쌓인다. 비회원은 이 엔드포인트 없이
 * localStorage만 지우면 된다.
 */
export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await createNewChat(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/reset] 세션 생성 실패:', error);
    return NextResponse.json({ error: '초기화하지 못했습니다.' }, { status: 500 });
  }
}
