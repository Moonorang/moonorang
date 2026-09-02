// membership_brands.discount_rules(jsonb) 안에 실제로 있는 형태
export interface MembershipDiscountRules {
  summary?: string;
  detail?: {
    provided_count?: string;
    instructions?: string[];
  };
}

// 멤버십 제휴 브랜드 타입 membership_brands 테이블 컬럼 반영
export interface MembershipBrand {
  id: string;
  name: string;
  category: string;
  // 목록 카드에 쓰는 브랜드 이미지 파일명 (public/images/catalog 안의 파일)
  icon: string | null;
  discountRules: MembershipDiscountRules | null;
}
