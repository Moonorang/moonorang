import type { Gender } from '@/entities/user/types';

// 요금제 가입(features/join)에서도 쓰게 돼 entities/user 로 옮겼다.
// 기존 import 경로가 계속 살아 있도록 여기서 다시 내보낸다.
export type { Gender };

// Supabase users 테이블 레코드 (컬럼명을 그대로 따름)
export interface UserRow {
  id: string;
  name: string;
  contact: string;
  gender: Gender | null;
  // YYYY-MM-DD (date 컬럼)
  birth: string | null;
  current_plan_id: number;
  point: number;
}
