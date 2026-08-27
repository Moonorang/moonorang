// 성별. users_gender_check에 맞춘 저장값이며, 화면 표시는 남/여로 매핑함
export type Gender = 'MALE' | 'FEMALE';

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
