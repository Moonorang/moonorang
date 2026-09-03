import { createClient } from '@/shared/lib/supabase/server';
import type { Plan, PlanBenefits, PlanOption } from '@/entities/plan/types';

const PLAN_COLUMNS =
  'id, name, description, monthly_fee, data_allowance, voice_sms, benefits, image';

interface PlanRow {
  id: number;
  name: string;
  description: string;
  monthly_fee: number;
  data_allowance: string;
  voice_sms: string;
  benefits: PlanBenefits | string | null;
  image: string;
}

function mapPlanRow(row: PlanRow): Plan {
  const benefits =
    typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    monthlyFee: row.monthly_fee,
    dataAllowance: row.data_allowance,
    voiceSms: row.voice_sms,
    benefits: benefits ?? null,
    image: row.image,
  };
}

// 전체 요금제 목록
export async function getAllPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .select(PLAN_COLUMNS)
    .order('monthly_fee', { ascending: true });

  if (error) {
    throw new Error(`요금제 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapPlanRow);
}

// 선택 목록용 최소 정보(id, 이름)만 조회 - 회원가입 요금제 셀렉트 등
export async function getPlanOptions(): Promise<PlanOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .select('id, name')
    .order('monthly_fee', { ascending: true })
    .returns<PlanOption[]>();

  if (error) {
    throw new Error(`요금제 선택 목록 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

// id 목록으로 요금제 조회
// LLM 이 준 planId 가 실제로 존재하는지도 이 조회로 검증
export async function getPlansByIds(ids: number[]): Promise<Plan[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .select(PLAN_COLUMNS)
    .in('id', ids);

  if (error) {
    throw new Error(`요금제 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapPlanRow);
}
