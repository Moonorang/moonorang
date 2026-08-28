// 요금제 성향 검사 (TEST-001~012)

// 성향 유형 식별자 - 데이터 사용량이 적은 순서
export type PlanTypeId = 'jamjam' | 'daily' | 'pop' | 'super';

// 맞춤 혜택 아이콘 종류 (lucide 아이콘에 매핑)
export type BenefitIcon = 'monitor' | 'wifi' | 'shield';

// 문항 선택지 - score 는 1~4, 클수록 데이터 니즈가 큼
export interface TestOption {
  score: number;
  label: string;
}

// 성향 검사 문항 (TEST-002: 5문항, TEST-003: 측정 축)
export interface TestQuestion {
  id: number;
  question: string;
  options: TestOption[];
  // 유형 판정 점수에 합산할지 - 예산 문항은 요금제 필터로만 쓰므로 false
  countsTowardType: boolean;
}

// 결과 화면에 노출할 맞춤 혜택
export interface TestBenefit {
  icon: BenefitIcon;
  title: string;
  description: string;
}

// 성향 유형 정의 (TEST-006 의 "사전에 정의된 기준")
export interface PlanType {
  id: PlanTypeId;
  name: string;
  description: string;
  imageSrc: string;
  // 유형 판정 점수 구간 - 양끝 포함
  minScore: number;
  maxScore: number;
  benefits: TestBenefit[];
}

// 진단 결과 (TEST-007)
export interface TestResult {
  type: PlanType;
  // 유형 판정에 쓰인 합산 점수 (4~16)
  typeScore: number;
  // 예산 문항 점수 (1~4) - 추천 요금제 선별에 사용
  budgetScore: number;
}
