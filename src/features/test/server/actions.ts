'use server';

import { z } from 'zod';

import { createClient } from '@/shared/lib/supabase/server';

/** 활동 로그에 남길 이벤트 이름 (user_event_logs.event_type) */
const TEST_EVENT_TYPE = 'LEISURE_TEST';

const testResultSchema = z.object({
  typeId: z.enum(['jamjam', 'daily', 'pop', 'super']),
  typeName: z.string().min(1).max(100),
  keywords: z.array(z.string().min(1).max(30)).max(10),
});

export interface SaveTestResultResult {
  /** 실제로 저장했는지. 비회원이면 저장하지 않고 false 로 돌아온다 */
  isSaved: boolean;
  errorMessage?: string;
}

/**
 * TEST-010: 취미 성향 검사 결과를 활동 로그에 남긴다.
 *
 * users 에 컬럼을 더하지 않고 user_event_logs 에 쌓는 이유는, 재응시할 때마다
 * 이력이 남아야 나중에 "요즘 취미가 어떻게 달라졌는지"까지 볼 수 있어서다
 * (ANALYSIS-001~003 의 데이터 소스가 이 테이블이다). 최신 성향이 필요하면
 * created_at 이 가장 늦은 한 건을 읽으면 된다.
 *
 * 비회원도 검사 자체는 할 수 있어야 해서(TEST-009) 로그인 상태가 아니면 조용히
 * 지나간다 - 실패가 아니라 저장할 자리가 없는 것뿐이다.
 */
export async function saveTestResult(
  input: unknown,
): Promise<SaveTestResultResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isSaved: false };

  // 클라이언트 검증을 신뢰하지 않고 서버에서 한 번 더 확인
  const parsed = testResultSchema.safeParse(input);

  if (!parsed.success) {
    return { isSaved: false, errorMessage: '검사 결과를 확인하지 못했어요.' };
  }

  const { error } = await supabase.from('user_event_logs').insert({
    user_id: user.id,
    event_type: TEST_EVENT_TYPE,
    event_details: parsed.data,
  });

  if (error) {
    console.error('[test] 검사 결과 저장 실패', error);

    return { isSaved: false, errorMessage: '검사 결과를 저장하지 못했어요.' };
  }

  return { isSaved: true };
}
