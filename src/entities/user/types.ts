import type { Plan } from '@/entities/plan/types';

// 성별. users.gender 의 저장값(users_gender_check)이며, 화면 표시는 남/여로 매핑한다.
// 회원가입(features/auth)과 요금제 가입(features/join) 양쪽이 써서 여기 둔다.
export type Gender = 'MALE' | 'FEMALE';

// users 테이블 + 현재 요금제(plans 조인) 프로필.
// CHAT-010(상담 문맥), CARD-023~026(절약 상담)에서 쓴다.
export interface UserProfile {
  id: string;
  name: string | null;
  contact: string | null;
  currentPlan: Plan | null;
  // DB의 remaining_data/data_limit 컬럼명은 MB처럼 보이지만 실제 저장 단위는 GB다
  remainingDataGb: number;
  dataLimitGb: number | null;
  point: number;
}

// user_monthly_usage 한 달치. billing_month는 'YYYY-MM'.
export interface MonthlyUsage {
  billingMonth: string;
  dataUsedMb: number;
}
