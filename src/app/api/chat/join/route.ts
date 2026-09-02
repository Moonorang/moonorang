import { NextResponse } from 'next/server';

import { getPlansByIds } from '@/entities/plan/server/planRepository';
import {
  MEMBER_GUARD_MESSAGE,
  MEMBER_GUARD_STATUS,
  requireMember,
} from '@/features/auth/server';
import {
  getOrCreateActiveChat,
  insertJoinFlowMessages,
} from '@/features/chat/server/chatRepository';

/**
 * CARD-029: 회원이 채팅 안에서 "신청하기"를 누른 순간을 DB에 남긴다 - 나중에 이
 * 대화를 복구했을 때 가입 카드가 그 자리에 그대로 다시 보이도록.
 * 비회원은 이 엔드포인트를 안 쓰고 클라이언트 상태로만 들고 있는다.
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

  const body = (await request.json().catch(() => null)) as { planId?: unknown } | null;
  const planId = typeof body?.planId === 'number' ? body.planId : null;

  if (planId === null) {
    return NextResponse.json({ error: 'planId가 필요합니다.' }, { status: 400 });
  }

  try {
    // CARD-001과 같은 원칙: 클라이언트가 보낸 요금제 정보를 그대로 믿지 않고,
    // id로 실제 DB 값을 다시 조회해서 저장한다.
    const [plan] = await getPlansByIds([planId]);
    if (!plan) {
      return NextResponse.json({ error: '요금제를 찾을 수 없습니다.' }, { status: 404 });
    }

    const chat = await getOrCreateActiveChat(user.id);
    await insertJoinFlowMessages(chat.id, plan);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/join] 저장 실패:', error);
    return NextResponse.json({ error: '가입 카드를 저장하지 못했습니다.' }, { status: 500 });
  }
}
