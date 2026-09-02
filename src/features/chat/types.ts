import type { PlanJoinProgress } from '@/entities/planJoin/types';
import type { Plan } from '@/entities/plan/types';
import type { UsageAnalysisResult } from '@/entities/usage/types';

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
  // CARD-022~026/028 - entities/usage(features/usage와 공유하는 도메인 개념)를 그대로 실어 보낸다
  | { event: 'usageAnalysis'; data: UsageAnalysisResult }
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
  /**
   * §2.4 "최근 채팅 메시지 N개" - summary에 아직 반영 안 된(=summarizedTurnCount 이후)
   * 구간의 원문. 요약은 8턴에 한 번만 갱신되므로, 이걸 안 보내면 그 사이(최대 7턴)는
   * 모델이 직전 대화조차 기억 못 하게 된다. 요약 직후엔 최근 3턴 정도로 짧다가
   * 다음 요약 직전엔 최대 7턴까지 늘어나는 식으로 오르내린다.
   */
  recentMessages?: SummarizeTurnMessage[];
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
  // usageAnalysis 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  usageAnalysis?: UsageAnalysisResult;
  /**
   * CARD-043: 가입을 마쳤을 때 남기는 메시지인지. 참이면 말풍선 아래에 축하 카드가
   * 붙는다 - 카드에 담을 값이 따로 없어서 표시만 해둔다.
   */
  isJoinResult?: boolean;
}

/**
 * CARD-029: 신청하기로 띄운 가입 카드 한 장.
 * 대화 이력(messages)과는 별도로 쌓이지만 같이 저장·복구돼야 해서,
 * useChat(상태·저장)과 ChatRoom(렌더)이 같이 쓰는 이 자리에 둔다.
 */
export interface PlanJoinBlock {
  plan: Plan;
  /**
   * 이 메시지 바로 뒤에 끼워 넣는다 - 대화 순서를 지키기 위한 것.
   * 신청하기를 누른 시점의 마지막 메시지라, 카드는 늘 그때까지의 대화 끝에 붙는다.
   */
  afterMessageId: string;
  /**
   * CARD-043: 결제까지 마친 카드인지. 카드 안에 두면 화면을 떠났다 돌아왔을 때
   * 다시 결제할 수 있게 되므로, 대화와 함께 저장되는 이 자리에 둔다.
   */
  isCompleted?: boolean;
  /**
   * CARD-046: 절차를 어디까지 밟았는지. 카카오 회원가입처럼 화면을 아주 떠났다
   * 돌아오는 경우가 있어서, 카드가 아니라 대화와 함께 저장되는 여기에 둔다.
   */
  progress?: PlanJoinProgress;
}

/**
 * 회원의 chat_messages.content에 카드를 저장할 때 쓰는 JSON 모양. text 컬럼 하나뿐이라
 * 일반 대화 텍스트와 구분하려고 이 모양(type 판별자)으로 직렬화해서 별도 행에 넣는다.
 * - join_flow: 그 자리에 가입 폼을 끼워 넣으라는 마커 (plan은 복구 시 id로 다시 조회)
 * - recommendation/usage_analysis: 그 시점에 실제로 보여준 카드 스냅샷을 그대로 저장
 *   (요금제 가격 등이 나중에 바뀌어도, 그때 상담받은 내용 그대로 복구돼야 하므로
 *   id 참조가 아니라 전체 값을 통째로 저장한다)
 */
export type ChatCardPayload =
  | { type: 'join_flow'; planId: number }
  | { type: 'recommendation'; plans: PlanRecommendation[] }
  | { type: 'usage_analysis'; data: UsageAnalysisResult };
