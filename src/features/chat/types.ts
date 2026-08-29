import type { Plan } from '@/entities/plan/types';

// 스펙

// LLM이 recommend_plans tool 을 호출할 때 채우는 입력값
// planId만 참조하고 이름/가격은 없음
export interface RecommendPlansToolInput {
  recommendations: {
    planId: number;
    rank: number;
    // 선정 이유
    reason: string;
  }[];
}

// 서버가 plans 테이블 조회 + 계산 결과를 합쳐서 클라이언트로 보내는 형태
export interface PlanRecommendation {
  plan: Plan;
  rank: number;
  reason: string;
  // 서버가 계산 (현재 요금제 있을 때, 양수일 때만 의미 있음)
  annualSavings?: number;
}

// LLM이 extract_conditions tool 을 호출할 때 채우는 입력값
// 누적 병합 X 최신값으로 덮어씀
export interface ExtractConditionsToolInput {
  dataUsage?: number;
  budget?: number;
  isBundle?: boolean | null;
  planPreferenceType?: string;
}

export type ChatErrorReason =
  'runtime_unavailable' | 'timeout' | 'invalid_format';

export type ChatStreamEvent =
  | { event: 'token'; data: { delta: string } }
  | { event: 'recommendation'; data: { plans: PlanRecommendation[] } }
  | { event: 'done'; data: Record<string, never> }
  | { event: 'error'; data: { reason: ChatErrorReason; message: string } };

export interface ChatRequestBody {
  message: string;
}

// useChat 훅이 관리하는 메시지 하나.
// AiMessage/UserMessage 에 그대로 매핑됨
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
  // recommendation 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  recommendations?: PlanRecommendation[];
}
