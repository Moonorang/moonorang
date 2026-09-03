import type { Plan } from '@/entities/plan/types';

// CARD-024/028 - 최근 3개월 데이터 사용량 추세. features/chat(수집)과
// features/usage(표시) 둘 다 참조해서 entities로 둔다.
export interface UsageTrendPoint {
  /** 'YYYY-MM' */
  billingMonth: string;
  dataUsedMb: number;
}

export interface UsageTrendData {
  /** 오래된 달 -> 최근 달 순 */
  points: UsageTrendPoint[];
  averageMb: number;
  /** 무제한 요금제면 null - 차트에 한계선을 안 그린다 */
  planLimitMb: number | null;
}

// CARD-023~026 - 절약 상담에서 판단한 대안 요금제. 후보가 하나뿐이라 rank는 없다.
export interface SavingsRecommendation {
  plan: Plan;
  /** downgrade일 때만 - 항상 양수 */
  annualSavings?: number;
}

export interface SavingsAnalysis {
  /** downgrade: 더 저렴한 요금제로 절약 가능 / upgrade: 데이터 부족으로 상위 요금제 필요 / keep: 지금이 최적 */
  type: 'downgrade' | 'upgrade' | 'keep';
  /** 왜 이렇게 판단했는지 - keep이어도 항상 있다. 실제 계산값 기반으로 서버가 만든 문장. */
  reason: string;
  recommendedPlan?: SavingsRecommendation;
}

export interface UsageAnalysisResult {
  currentPlan: Plan;
  remainingDataGb: number;
  dataLimitGb: number | null;
  /** "내 요금제 정보 알려줘"처럼 현재 상태만 물었을 땐 없음(최근 3개월 사용 이력이
   * 없어도 이 카드는 떠야 해서, 이 모드는 이력 조회 자체를 안 한다) */
  trend?: UsageTrendData;
  /** "절약해줘"처럼 절약 판단까지 요청했을 때만 있음. 추세만/현재 정보만 물었을 땐 없음 */
  savings?: SavingsAnalysis;
}
