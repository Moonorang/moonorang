import { NextResponse } from 'next/server';

import { getAllPlans } from '@/lib/plans';

// 전체 요금제 목록
// Supabase 조회 + 필드 매핑이 LLM 없이 단독으로 맞게 동작하는지 확인하는 용도
export async function GET() {
  try {
    const plans = await getAllPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('[api/plans] 조회 실패:', error);
    return NextResponse.json(
      { error: '요금제 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
