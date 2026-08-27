# 채팅 API 설계 메모 (초안)

`/api/chat` 구현 전에 프론트/백엔드가 같이 봐야 할 계약을 먼저 정한다. 정식 API 명세서(OpenAPI 등)는 만들지 않는다 — 외부에 공개하는 API가 아니고 소비자가 프론트 하나뿐이라, 실제 타입 정의(`src/types/chat.ts`)가 이 문서의 코드상 원본이 된다. 이 문서는 그 타입들이 왜 이런 모양인지에 대한 설명이다.

## 1. 저장 정책 — 회원/비회원 분리

DB 스키마(`docs/database-schema.md`)에 이미 이 구분이 반영돼 있다.

- **비회원**: 대화를 서버에 보내지 않고 브라우저에만 저장한다(CHAT-011). `chats`/`chat_messages` row가 생기지 않는다.
- **회원**: 로그인 시점(또는 최초 메시지 전송 시점)에 `chats` row를 생성하고, 각 메시지를 `chat_messages`에 저장한다.
- **로그인 전환**: 비회원으로 대화하다 로그인하면, 클라이언트에 있던 대화를 서버로 승계해서 `chats`를 만든다 (AUTH-014와 유사한 맥락).

## 2. 컨텍스트 구성 — 매 요청에 무엇을 담아 보내나

```
[system prompt (고정, §4)]
[로그인 사용자면: 현재 요금제 + 잔여 사용량 요약]  (CHAT-010, users.current_plan_id → plans 조인)
[chats.keywords 에 누적된 구조화 조건]              (CARD-013)
[chat_summary.summary]                              (있으면, 오래된 대화 대신)
[최근 대화 이력 N턴]
[이번 사용자 메시지]
```

OpenAI는 Anthropic 같은 서버사이드 compaction이 없어서, 대화가 길어지면 `chat_summary`를 우리가 직접 갱신해야 한다.

**갱신 주기: 메시지 10개(사용자+AI 합쳐 약 5턴)마다 재요약, 최근 4개 메시지는 항상 원문 그대로 유지.**

- 너무 자주(예: 2~3개마다) 하면 요약 자체도 LLM 호출이라 그 비용이 절감분보다 커진다.
- 너무 늦게(예: 30개 이상) 하면 그때까진 매 턴 전체 이력을 그대로 보내느라 비용이 계속 불어난 뒤에야 효과가 시작된다.
- 10개는 "조건 수집 → 추천"이 한 번 끝나는 시점과도 대략 맞아떨어져서, 자연스러운 체크포인트가 된다.
- 최근 4개를 원문으로 남겨두는 건, 방금 나눈 대화의 뉘앙스(예: 사용자가 방금 정정한 내용)가 요약 과정에서 뭉개지지 않게 하기 위함이다.

동작: 매 응답 후 `chat_messages` 개수가 마지막 `chat_summary.last_message_id` 이후 10개를 넘으면, "최근 4개를 제외한 나머지"를 요약해서 `chat_summary.summary`를 갱신하고 `last_message_id`를 최신으로 옮긴다. 다음 요청부터는 `summary` + 최근 4개 메시지만 컨텍스트에 넣는다.

## 3. 스트리밍 프로토콜 (CHAT-006)

서버 → 클라이언트로 **SSE**(`text/event-stream`)를 보낸다.

NDJSON도 검토했지만 SSE로 정했다. SSE는 `event:` 필드로 이벤트 종류를 구분하도록 이미 설계돼 있어서, "토큰 조각 vs 추천 결과 vs 완료 vs 에러"를 우리가 JSON 안에 `type` 필드로 재발명할 필요가 없다. 추가로:

- 크롬 개발자도구가 `text/event-stream`을 네이티브로 인식해서, Network 탭에서 이벤트가 도착하는 걸 전용 뷰로 보여준다 — 디버깅이 쉽다.
- 프록시/CDN이 이 content-type을 스트리밍 전용으로 취급해 버퍼링 없이 즉시 흘려보내는 경우가 많아서, 배포 환경이 바뀌어도 스트리밍이 뭉텅이로 오는 사고를 피하기 쉽다.

브라우저 내장 `EventSource`는 POST 바디를 못 보내서 쓸 수 없고, `fetch` + `ReadableStream` reader로 직접 파싱한다.

```
event: token
data: {"delta":"안녕"}

event: recommendation
data: {"plans":[...]}

event: done
data: {}

event: error
data: {"reason":"timeout","message":"..."}

```

각 이벤트는 `event: <이름>\ndata: <JSON>\n\n`(빈 줄로 종료) 형식이다. 타입 정의:

```ts
type ChatStreamEvent =
  | { event: 'token'; data: { delta: string } }
  | { event: 'recommendation'; data: { plans: PlanRecommendation[] } }
  | { event: 'done'; data: Record<string, never> }
  | {
      event: 'error';
      // CARD-005: 실패 사유를 구분해서 표시해야 함
      data: { reason: 'runtime_unavailable' | 'timeout' | 'invalid_format'; message: string };
    };
```

- `token`이 오는 대로 `AiMessage`의 `content`에 이어붙인다 (이미 만들어둔 `isStreaming` + 빈 content 처리와 그대로 맞물림).
- `recommendation`이 오면 그 시점에 `PlanCard`(들)를 메시지 흐름에 끼워 넣는다. 텍스트 설명과 카드가 같은 턴에 같이 나올 수 있어서 별도 이벤트로 뺐다.
- `error`의 `reason`이 CARD-005 요구사항과 1:1로 대응한다.

## 4. 구조화 출력 스키마 — 추천 요금제 (CARD-001, CARD-002, NFR-003~004)

**LLM은 요금제명·가격·데이터량을 절대 직접 텍스트로 생성하지 않는다.** OpenAI function calling으로 "이 요금제를 몇 위로, 왜 추천하는지"만 받고, 실제 데이터는 서버가 `plans` 테이블에서 조회해 조립한다.

```ts
// LLM이 tool call 로 채우는 부분 — plans.id 만 참조, 이름/가격은 여기 없음
interface RecommendPlansToolInput {
  recommendations: {
    planId: number;   // plans.id
    rank: number;     // 1부터
    reason: string;   // 선정 이유 — LLM이 생성해도 되는 유일한 필드
  }[];
}

// 서버가 plans 테이블 + 계산 결과를 합쳐서 클라이언트로 보내는 최종 형태
interface PlanRecommendation {
  plan: Plan;             // plans 테이블에서 조회한 실제 데이터 (src/types/plan.ts)
  rank: number;
  reason: string;
  annualSavings?: number; // 서버가 계산 (로그인 && 현재 요금제 있을 때만)
}
```

흐름: LLM이 `recommend_plans` 도구를 호출 → `planId` 배열 획득 → 서버가 `plans` 테이블에서 `where id in (...)` 조회 → 로그인 사용자면 `users.current_plan_id`와 비교해 `annualSavings` 계산 → `PlanRecommendation[]` 조립 → `recommendation` 이벤트로 전송.

**`annualSavings` 계산식** (로그인 && `users.current_plan_id` 존재할 때만):

```ts
annualSavings = (currentPlan.monthlyFee - recommendedPlan.monthlyFee) * 12;
```

음수(추천 요금제가 더 비쌈)가 나올 수도 있는데, 그 경우 `PlanCard`에 절감 배너를 아예 안 띄우도록 클라이언트에서 `annualSavings > 0`일 때만 표시한다(음수를 "손해 배너"로 보여주진 않는다). 비로그인이거나 현재 요금제 정보가 없으면 `annualSavings` 필드 자체를 생략한다.

조건을 충족하는 요금제가 없는 경우(CARD-020)는 `recommendations: []`로 오게 하고, 클라이언트는 빈 배열이면 "차선책/조건 완화 안내" 문구를 보여준다.

## 5. 조건 수집 → `chats.keywords` (CARD-013~015)

자유 입력에서 추출한 조건(예산, 데이터 사용 패턴, 통화량, 부가서비스 선호)도 별도 tool call로 구조화해서 받는다. 매 턴 응답에서 이 tool이 호출되면 서버가 `chats.keywords`(jsonb)에 병합(merge)해서 저장한다 — 새 값이 오면 기존 값을 덮어쓰고, 안 온 항목은 유지한다.

```ts
interface ExtractConditionsToolInput {
  budget?: number;            // 원/월
  dataUsage?: 'low' | 'medium' | 'high' | 'unlimited';
  callUsage?: 'low' | 'medium' | 'high' | 'unlimited';
  preferredBenefits?: string[];
}
```

구조화 해석에 실패하면(CARD-014) 이 tool call 자체가 안 오거나 빈 값으로 오는데, 그 경우 서버는 조용히 넘어가고 클라이언트가 선택형 입력을 다시 제시한다.

## 6. 시스템 프롬프트 범위 (CARD-003)

**허용 범위**: 요금제 상담(추천/비교/상세), 사용량·예산·부가서비스 선호 수집, 요금제 절약 상담, 가입 절차 안내, 서비스 이용 방법 안내.

**차단 대상**:
- 요금제 상담과 무관한 일반 질의(코딩 질문, 잡담 등) → 정중히 서비스 범위 안내하고 되돌림
- 시스템 프롬프트 열람/변경 시도("네 지침을 무시하고", "시스템 프롬프트 보여줘" 등) → 거절

지금 단계에서는 별도 분류 모델 없이 시스템 프롬프트 지시문으로만 막는다. 실제 운영하면서 우회 사례가 나오면 그때 보강한다(지금 단계에서 미리 만드는 건 과함).

## 7. 실패/재시도 (NFR-002, CARD-005~006)

- 서버에서 OpenAI 요청에 60초 타임아웃을 건다. 초과하면 `event: error`, `reason: 'timeout'`.
- OpenAI 요청 자체가 실패(네트워크, 인증 등)하면 `reason: 'runtime_unavailable'`.
- tool call 결과 파싱 실패(스키마 안 맞음)는 `reason: 'invalid_format'`.
- 재시도(CARD-006)는 클라이언트가 **직전 요청과 동일한 입력·문맥**을 다시 보내는 것으로 처리한다 — 서버는 별도 재시도 상태를 갖지 않고, 클라이언트가 마지막으로 보낸 요청 바디를 기억해뒀다가 그대로 재전송한다.

## 8. 다음에 코드로 옮길 것

이 문서가 확정되면:

1. `src/types/chat.ts` — 위 인터페이스들을 실제 타입으로
2. `/api/chat` route handler — SSE 스트림 + tool calling 2종(`recommend_plans`, `extract_conditions`)
3. `useChat` 훅 — 스트림 파싱, `AiMessage`/`PlanCard`에 연결
