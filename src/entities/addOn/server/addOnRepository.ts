import { createClient } from '@/shared/lib/supabase/server';
import type { AddOn, AddOnDescription } from '@/entities/addOn/types';

const ADD_ON_COLUMNS = 'id, title, sub_title, base_monthly_rate, description';

interface AddOnRow {
  id: number;
  title: string;
  sub_title: string;
  base_monthly_rate: number;
  description: AddOnDescription | string | null;
}

// description 은 실제로는 문자열로 오는 경우가 섞여 있어, 그 경우 안내문으로 다룬다.
function mapAddOnRow(row: AddOnRow): AddOn {
  const description =
    typeof row.description === 'string'
      ? { guide: row.description }
      : row.description;

  return {
    id: row.id,
    title: row.title,
    subTitle: row.sub_title,
    baseMonthlyRate: row.base_monthly_rate,
    description: description ?? null,
  };
}

// 전체 부가서비스 목록
export async function getAllAddOns(): Promise<AddOn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('add_ons')
    .select(ADD_ON_COLUMNS)
    .order('base_monthly_rate', { ascending: true })
    .overrideTypes<AddOnRow[], { merge: false }>();

  if (error) {
    throw new Error(`부가서비스 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapAddOnRow);
}
