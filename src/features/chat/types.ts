import type { Plan } from '@/entities/plan/types';

// 스펙

/**
 * 채팅에서 파악한 요금제 조건 (chat-api-design.md §2.5/§5).
 * extract_conditions tool의 출력이자, chats.keywords에 대응하는 모양이다.
 * 값이 없는 필드는 "아직 안 물어봤다"는 뜻 - 누적 병합이 아니라 최신값으로 덮어쓴다.
 */
export interface ChatKeywords {
  /** 예산 상한 (원/월) */
  budget?: number;
  /** 예상 월 데이터 사용량 (GB) */
  dataUsageGb?: number;
  /** 예상 월 테더링/쉐어링 사용량 (GB) */
  tetheringGb?: number;
}

// 서버가 plans 테이블 조회 + 계산 결과를 합쳐서 클라이언트로 보내는 형태
export interface PlanRecommendation {
  plan: Plan;
  rank: number;
  reason: string;
  // 서버가 계산 (현재 요금제 있을 때, 양수일 때만 의미 있음)
  annualSavings?: number;
}

export type ChatErrorReason =
  'runtime_unavailable' | 'timeout' | 'invalid_format';

export type ChatStreamEvent =
  | { event: 'token'; data: { delta: string } }
  | { event: 'recommendation'; data: { plans: PlanRecommendation[] } }
  // 이번 턴까지 반영된 최신 조건 - 클라이언트가 다음 요청에 그대로 실어 보낸다
  | { event: 'keywords'; data: { keywords: ChatKeywords } }
  | { event: 'done'; data: Record<string, never> }
  | { event: 'error'; data: { reason: ChatErrorReason; message: string } };

export interface ChatRequestBody {
  message: string;
  /**
   * 지금까지 파악된 조건 (CHAT-011: 서버 DB에 저장하지 않고 클라이언트가 들고 있다가
   * 매 요청에 실어 보낸다). 없으면 빈 값으로 취급한다.
   */
  keywords?: ChatKeywords;
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
