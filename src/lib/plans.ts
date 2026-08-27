import { createClient } from '@/lib/supabase/server';
import type { Plan, PlanBenefits } from '@/types/plan';

const PLAN_COLUMNS =
  'id, name, description, monthly_fee, data_allowance, voice_sms, benefits';

interface PlanRow {
  id: number;
  name: string;
  description: string;
  monthly_fee: number;
  data_allowance: string;
  voice_sms: string;
  benefits: PlanBenefits | string | null;
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
