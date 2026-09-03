import { NextResponse } from 'next/server';

import {
  MEMBER_GUARD_MESSAGE,
  MEMBER_GUARD_STATUS,
  requireMember,
} from '@/features/auth/server';
import { parseChatKeywordsRequest } from '@/features/chat/lib/schema';
import {
  getOrCreateActiveChat,
  updateChatKeywords,
} from '@/features/chat/server/chatRepository';
import type { ChatKeywords } from '@/features/chat/types';

/**
 * CARD-013/015: 관심사 선택 화면에서 고친 관심사를 회원의 chats.keywords 에 반영한다.
 *
 * 회원 대화는 DB가 유일한 진짜 기록이라(chatStream.ts가 클라이언트가 보낸 keywords를
 * 무시하고 DB 값을 읽는다) 여기서 저장해두지 않으면 다음 메시지에서 예전 관심사로
 * 되돌아간다. 비회원은 이 엔드포인트를 안 쓰고 localStorage에만 남긴다(CHAT-011).
 *
 * 대화를 아직 시작하지 않았어도 저장할 수 있어야 해서(추가 기능 메뉴에서 바로 열 수
 * 있다) 세션이 없으면 만들어서 쓴다.
 */
export async function POST(request: Request) {
  const guard = await requireMember();

  if (!guard.isMember) {
    return NextResponse.json(
      { error: MEMBER_GUARD_MESSAGE[guard.reason] },
      { status: MEMBER_GUARD_STATUS[guard.reason] },
    );
  }

  const parsed = parseChatKeywordsRequest(
    await request.json().catch(() => null),
  );

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  try {
    const chat = await getOrCreateActiveChat(guard.user.id);

    // 관심사만 통째로 바꾸고 예산·데이터 사용량 등 나머지 조건은 그대로 둔다.
    // 여기서는 mergeKeywords 처럼 합집합으로 누적하지 않는다 - 사용자가 칩을 직접
    // 뺀 것도 하나의 결정이라, 뺀 것이 다시 살아나면 안 된다.
    const keywords: ChatKeywords = { ...chat.keywords };

    if (parsed.data.interests.length > 0) {
      keywords.interests = parsed.data.interests;
    } else {
      delete keywords.interests;
    }

    await updateChatKeywords(chat.id, keywords);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/keywords] 관심사 저장 실패:', error);

    return NextResponse.json(
      { error: '관심사를 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
