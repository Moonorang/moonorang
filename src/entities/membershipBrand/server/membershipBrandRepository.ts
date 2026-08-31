import { createClient } from '@/shared/lib/supabase/server';
import type {
  MembershipBrand,
  MembershipDiscountRules,
} from '@/entities/membershipBrand/types';

const MEMBERSHIP_BRAND_COLUMNS = 'id, name, category, discount_rules';

interface MembershipBrandRow {
  id: string;
  name: string;
  category: string;
  discount_rules: MembershipDiscountRules | null;
}

function mapMembershipBrandRow(row: MembershipBrandRow): MembershipBrand {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    discountRules: row.discount_rules ?? null,
  };
}

// 전체 멤버십 제휴 브랜드 목록
export async function getAllMembershipBrands(): Promise<MembershipBrand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('membership_brands')
    .select(MEMBERSHIP_BRAND_COLUMNS)
    .order('id', { ascending: true })
    .overrideTypes<MembershipBrandRow[], { merge: false }>();

  if (error) {
    throw new Error(`멤버십 제휴 브랜드 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapMembershipBrandRow);
}
