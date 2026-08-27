// 요금제 선택 옵션 (Supabase plans 테이블에서 필요한 최소 필드)
export interface PlanOption {
  id: number;
  name: string;
}

// 요금제 타입
// plans.benefits 안에 실제로 있는 키들
export interface PlanBenefits {
  media_contents?: string;
  vip_membership?: string;
  max_benefit_value?: string;
  tethering_sharing?: string;
}

// 요금제 타입 plans 테이블 컬럼 반영
// data_allowance, voice_sms는 원문 그대로 갖고 있고 화면에 나눠서 보여줘야 하는 부분은 util/planFormat.ts에서 파싱함
export interface Plan {
  id: number;
  name: string;
  description: string;
  monthlyFee: number;
  dataAllowance: string;
  voiceSms: string;
  benefits: PlanBenefits | null;
}
