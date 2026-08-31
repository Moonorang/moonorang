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
  /**
   * 오래된 대화를 압축한 요약 (§2.3 "대화 요약" 계층 - 비회원용은 chats.keywords 같은
   * DB row가 없어서 클라이언트가 localStorage로 들고 있다가 매 요청에 실어 보낸다).
   * 시스템 프롬프트에 "이전 대화 요약"으로 끼워 넣는다.
   */
  summary?: string;
}

/** 요약 대상이 되는 메시지 한 개 - chat completions 메시지보다 가벼운 형태만 필요하다 */
export interface SummarizeTurnMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ChatSummarizeRequestBody {
  /** 이번에 새로 요약에 포함시킬 원문 메시지들 (이미 요약된 부분은 제외하고 보낸다) */
  messages: SummarizeTurnMessage[];
  /** 기존 요약 - 있으면 이어붙여서 누적 재요약한다 */
  existingSummary?: string;
}

export interface ChatSummarizeResponseBody {
  summary: string;
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
