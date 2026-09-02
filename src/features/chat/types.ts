import type { AddOn } from '@/entities/addOn/types';
import type { JoinKind, JoinProgress } from '@/entities/join/types';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';
import type { UsageAnalysisResult } from '@/entities/usage/types';

// 스펙

/**
 * 채팅에서 파악한 요금제 조건 (chat-api-design.md §2.5/§5).
 * extract_conditions tool의 출력이자, chats.keywords에 대응하는 모양이다.
 * 값이 없는 필드는 "아직 안 물어봤다"는 뜻 - 누적 병합이 아니라 최신값으로 덮어쓴다.
 *
 * 예외: interests는 "현재 값"이 아니라 "그동안 알아낸 것들의 목록"이라 성격이 달라서,
 * mergeKeywords.ts에서 덮어쓰지 않고 기존 값에 새로 언급된 것만 더한다(합집합).
 */
export interface ChatKeywords {
  /** 예산 상한 (원/월) */
  budget?: number;
  /** 예상 월 데이터 사용량 (GB) */
  dataUsageGb?: number;
  /** 예상 월 테더링/쉐어링 사용량 (GB) */
  tetheringGb?: number;
  /**
   * 대화에서 드러난 관심사·선호·흥미 키워드 (예: "넷플릭스", "게임", "여행", "카페").
   * CARD-013 중 아직 비어있던 "부가서비스 선호" 부분 - 부가서비스/구독 상품 개인화
   * 추천(CARD-027~028)의 재료가 된다.
   */
  interests?: string[];
}

// 서버가 plans 테이블 조회 + 계산 결과를 합쳐서 클라이언트로 보내는 형태
export interface PlanRecommendation {
  plan: Plan;
  rank: number;
  reason: string;
  // 서버가 계산 (현재 요금제 있을 때, 양수일 때만 의미 있음)
  annualSavings?: number;
}

// CARD-027~028: 서버가 add_ons 테이블 조회 + user_add_ons 채택률 계산을 합쳐서 보내는 형태
export interface AddOnRecommendation {
  addOn: AddOn;
  rank: number;
  /** entities/addOn/server의 getAddOnAdoptionRates 실 데이터(0~100) - "N%의 고객님이 선택했어요" */
  adoptionRate: number;
}

// AddOnRecommendation과 같은 원칙 - subscriptions 테이블 + user_subscriptions 채택률
export interface SubscriptionRecommendation {
  subscription: Subscription;
  rank: number;
  /** entities/subscription/server의 getSubscriptionAdoptionRates 실 데이터(0~100) */
  adoptionRate: number;
}

// CARD-028: membership_brands 테이블 + 카카오 로컬 API(키워드 검색)로 찾은 가장
// 가까운 지점 하나를 합친 형태. 브랜드마다 가장 가까운 지점 1개씩만 담는다.
export interface NearbyMembership {
  brand: MembershipBrand;
  /** 카카오 로컬 API가 찾아준 실제 지점명 (예: "GS25 대치한국점") */
  placeName: string;
  distanceMeters: number;
  /** 지점 좌표 - 미니 지도에 핀을 찍을 때 씀(NearbyMembershipCard) */
  lat: number;
  lng: number;
}

export type ChatErrorReason =
  'runtime_unavailable' | 'timeout' | 'invalid_format';

export type ChatStreamEvent =
  | { event: 'token'; data: { delta: string } }
  | { event: 'recommendation'; data: { plans: PlanRecommendation[] } }
  // CARD-027~028: 관심사 기반 부가서비스 추천 카드
  | { event: 'addOnRecommendation'; data: { addOns: AddOnRecommendation[] } }
  // CARD-027~028: 관심사 기반 구독 상품 추천 카드
  | {
      event: 'subscriptionRecommendation';
      data: { subscriptions: SubscriptionRecommendation[] };
    }
  // CARD-028: 주변 멤버십 사용처 카드
  | { event: 'nearbyMembership'; data: { memberships: NearbyMembership[] } }
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
  /**
   * CARD-028 "주변 멤버십 사용처" - 브라우저 Geolocation으로 얻은 현재 위치.
   * 클라이언트가 매 요청에 실어 보내고(위치를 못 얻었으면 생략), 서버는 저장하지
   * 않는다 - keywords/summary와 같은 "요청마다 왕복" 방식이다.
   */
  location?: { lat: number; lng: number };
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
  // addOnRecommendation 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  addOnRecommendations?: AddOnRecommendation[];
  // subscriptionRecommendation 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  subscriptionRecommendations?: SubscriptionRecommendation[];
  // nearbyMembership 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  nearbyMemberships?: NearbyMembership[];
  // usageAnalysis 이벤트가 오면 채워짐 (AI 메시지에만 해당)
  usageAnalysis?: UsageAnalysisResult;
  /**
   * CARD-043: 가입을 마쳤을 때 남기는 메시지인지. 값이 있으면 말풍선 아래에 축하
   * 카드가 붙는다 - 축하 문구가 무엇을 가입했는지에 따라 달라서, 있다/없다가
   * 아니라 그 종류를 담는다.
   */
  joinResultKind?: JoinKind;
}

/** JoinBlock 에서 상품 종류와 무관한 부분 */
interface JoinBlockBase {
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
  progress?: JoinProgress;
}

/**
 * CARD-029: 신청하기로 띄운 가입 카드 한 장.
 * 대화 이력(messages)과는 별도로 쌓이지만 같이 저장·복구돼야 해서,
 * useChat(상태·저장)과 ChatRoom(렌더)이 같이 쓰는 이 자리에 둔다.
 *
 * kind 로 가르는 판별 유니온인 이유는, 상품마다 카드에 넘길 값의 모양이 달라서다
 * (요금제는 Plan, 부가서비스는 AddOn). 종류가 늘면 여기에 갈래를 하나 더하면 되고,
 * 그러면 이 값을 다루는 곳들이 컴파일 오류로 한 번에 드러난다.
 *
 * 상품 번호는 item.id 에 이미 있어서 따로 갖지 않는다 - 카드를 찾을 때 쓰는
 * JoinTarget 은 getJoinBlockTarget(lib/joinBlock.ts)으로 만들어 쓴다.
 */
export type JoinBlock = JoinBlockBase & JoinBlockItem;

/**
 * 가입 카드가 가리키는 상품. 카드를 새로 띄울 때(addJoinBlock) 넘기는 값이기도 하다.
 * 절차를 어디까지 밟았는지(JoinBlockBase)와 분리해둔 이유는, 카드를 띄우는 쪽은
 * 무엇을 가입하는지만 알면 되고 진행 상태는 그 뒤에 붙는 것이기 때문이다.
 */
export type JoinBlockItem = { kind: 'plan'; item: Plan };

/**
 * 회원의 chat_messages.content에 카드를 저장할 때 쓰는 JSON 모양. text 컬럼 하나뿐이라
 * 일반 대화 텍스트와 구분하려고 이 모양(type 판별자)으로 직렬화해서 별도 행에 넣는다.
 * - join_flow: 그 자리에 가입 폼을 끼워 넣으라는 마커 (plan은 복구 시 id로 다시 조회)
 * - recommendation/usage_analysis: 그 시점에 실제로 보여준 카드 스냅샷을 그대로 저장
 *   (요금제 가격 등이 나중에 바뀌어도, 그때 상담받은 내용 그대로 복구돼야 하므로
 *   id 참조가 아니라 전체 값을 통째로 저장한다)
 */
export type ChatCardPayload =
  /**
   * 가입 카드 한 장. progress·isCompleted 는 절차가 진행될 때마다 이 마커 행을
   * 고쳐서 남긴다 - 새 행을 쌓으면 대화에 없는 말이 늘어나기 때문이다(CARD-043/046).
   *
   * kind 가 생기기 전에 저장된 행은 planId 만 갖고 있는데, 그 모양은 여기까지
   * 올라오지 않는다 - tryParseCardPayload 가 읽으면서 요금제로 풀어준다.
   */
  | {
      type: 'join_flow';
      kind: JoinKind;
      itemId: number;
      progress?: JoinProgress;
      isCompleted?: boolean;
    }
  /**
   * 바로 앞 AI 메시지가 가입 결과라는 표시 - 말풍선 아래에 축하 카드가 붙는다.
   * 무엇을 가입한 결과인지에 따라 축하 문구가 달라서 kind 를 함께 남긴다.
   */
  | { type: 'join_result'; kind: JoinKind }
  | { type: 'recommendation'; plans: PlanRecommendation[] }
  | { type: 'add_on_recommendation'; addOns: AddOnRecommendation[] }
  | {
      type: 'subscription_recommendation';
      subscriptions: SubscriptionRecommendation[];
    }
  | { type: 'nearby_membership'; memberships: NearbyMembership[] }
  | { type: 'usage_analysis'; data: UsageAnalysisResult };
