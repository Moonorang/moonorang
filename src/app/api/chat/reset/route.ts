import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/server';
import {
  createNewChat,
  deleteChat,
  getActiveChat,
} from '@/features/chat/server/chatRepository';

/**
 * CHAT-014: 회원이 대화를 초기화하면 이전 세션(과 그 chat_messages/chat_summary -
 * cascade로 같이 지워짐)을 지우고 새 세션을 만든다. 이 화면은 대화 목록 UI 없이
 * "현재 세션" 하나만 재사용하는 구조라, 지우지 않고 두면 다시는 안 쓰이는 세션이
 * DB에 계속 쌓이기만 한다. 비회원은 이 엔드포인트 없이 localStorage만 지우면 된다.
 */
export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const existing = await getActiveChat(user.id);
    if (existing) await deleteChat(existing.id);

    await createNewChat(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/reset] 초기화 실패:', error);
    return NextResponse.json({ error: '초기화하지 못했습니다.' }, { status: 500 });
  }
}
