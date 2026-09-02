import { NextResponse } from 'next/server';

import { getPlansByIds } from '@/entities/plan/server/planRepository';
import {
  MEMBER_GUARD_MESSAGE,
  MEMBER_GUARD_STATUS,
  requireMember,
} from '@/features/auth/server';
import {
  getActiveChat,
  getOrCreateActiveChat,
  insertJoinFlowMessages,
  insertJoinResultMessages,
  updateJoinFlowMarker,
} from '@/features/chat/server/chatRepository';
import type { PlanJoinProgress } from '@/entities/planJoin/types';

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

interface JoinPatchBody {
  planId?: unknown;
  progress?: unknown;
  isCompleted?: unknown;
  resultMessage?: unknown;
}

/**
 * CARD-043/046: 가입 절차가 진행되거나 끝나면 그 사실을 카드 마커에 덮어쓴다.
 * 완료 문구까지 함께 오면 결과 말풍선도 이 자리에서 대화에 남긴다 - 두 번 왕복하지
 * 않으려고 한 번에 처리한다.
 *
 * 비회원은 이 엔드포인트를 안 쓰고 localStorage 로만 들고 있는다.
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as JoinPatchBody | null;
  const planId = typeof body?.planId === 'number' ? body.planId : null;

  if (planId === null) {
    return NextResponse.json(
      { error: 'planId가 필요합니다.' },
      { status: 400 },
    );
  }

  const progress =
    body?.progress && typeof body.progress === 'object'
      ? (body.progress as PlanJoinProgress)
      : undefined;
  const isCompleted =
    typeof body?.isCompleted === 'boolean' ? body.isCompleted : undefined;
  const resultMessage =
    typeof body?.resultMessage === 'string' && body.resultMessage.length > 0
      ? body.resultMessage
      : undefined;

  try {
    // 카드가 이미 있다는 뜻이므로 세션도 반드시 있다 - 없으면 새로 만들 게 아니라
    // 남길 자리가 없는 것이라 그대로 알려준다.
    const chat = await getActiveChat(user.id);
    if (!chat) {
      return NextResponse.json(
        { error: '대화 세션을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const isUpdated = await updateJoinFlowMarker(chat.id, planId, {
      progress,
      isCompleted,
    });

    if (!isUpdated) {
      return NextResponse.json(
        { error: '가입 카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (resultMessage) {
      await insertJoinResultMessages(chat.id, resultMessage);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/chat/join] 진행 상태 저장 실패:', error);
    return NextResponse.json(
      { error: '가입 진행 상태를 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
