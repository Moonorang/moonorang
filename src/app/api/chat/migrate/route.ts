import { NextResponse } from 'next/server';

import {
  MEMBER_GUARD_MESSAGE,
  MEMBER_GUARD_STATUS,
  requireMember,
} from '@/features/auth/server';
import { migrateGuestChat } from '@/features/chat/server/migrateGuestChat';
import type {
  ChatKeywords,
  ChatMessage,
  JoinBlock,
} from '@/features/chat/types';

interface MigrateRequestBody {
  messages?: ChatMessage[];
  joinBlocks?: JoinBlock[];
  keywords?: ChatKeywords;
  summary?: string;
}

/**
 * CHAT-011/012 "로그인 전환": 비회원으로 나눈 대화(클라이언트 localStorage에 있던
 * 것)를 로그인 직후 서버로 승계한다. 형식 검증은 최소한만 한다 - 클라이언트 자기
 * 자신이 방금까지 들고 있던 상태를 그대로 보내는 것이라 굳이 엄격하게 안 막는다.
 */
export async function POST(request: Request) {
  const guard = await requireMember();

  if (!guard.isMember) {
    return NextResponse.json(
      { error: MEMBER_GUARD_MESSAGE[guard.reason] },
      { status: MEMBER_GUARD_STATUS[guard.reason] },
    );
  }

  const user = guard.user;

  const body = (await request
    .json()
    .catch(() => null)) as MigrateRequestBody | null;
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const joinBlocks = Array.isArray(body?.joinBlocks) ? body.joinBlocks : [];

  // 말도 카드도 없으면 옮길 것이 없다 - 카드만 있는 대화는 승계 대상이다
  if (messages.length === 0 && joinBlocks.length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await migrateGuestChat(user.id, {
      messages,
      joinBlocks,
      keywords: body?.keywords ?? {},
      summary: body?.summary,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/migrate] 승계 실패:', error);
    return NextResponse.json(
      { error: '대화를 이어받지 못했습니다.' },
      { status: 500 },
    );
  }
}
