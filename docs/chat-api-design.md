# 채팅 API 설계 메모 (초안)

`/api/chat` 구현 전에 프론트/백엔드가 같이 봐야 할 계약을 먼저 정한다. 정식 API 명세서(OpenAPI 등)는 만들지 않는다 — 외부에 공개하는 API가 아니고 소비자가 프론트 하나뿐이라, 실제 타입 정의(`src/types/chat.ts`)가 이 문서의 코드상 원본이 된다. 이 문서는 그 타입들이 왜 이런 모양인지에 대한 설명이다.

## 1. 저장 정책 — 회원/비회원 분리

DB 스키마(`docs/database-schema.md`)에 이미 이 구분이 반영돼 있다.

- **비회원**: 대화를 서버에 보내지 않고 브라우저에만 저장한다(CHAT-011). `chats`/`chat_messages` row가 생기지 않는다.
- **회원**: 로그인 시점(또는 최초 메시지 전송 시점)에 `chats` row를 생성하고, 각 메시지를 `chat_messages`에 저장한다.
- **로그인 전환**: 비회원으로 대화하다 로그인하면, 클라이언트에 있던 대화를 서버로 승계해서 `chats`를 만든다 (AUTH-014와 유사한 맥락).

## 2. 컨텍스트 관리

### 2.1 배경

사용자와 챗봇 간의 채팅이 누적될수록 **이전 대화 전체를 저장하고 이를 컨텍스트로 전달하는 방식**은 토큰 비용이 증가하고, 응답 품질이 저하되는 문제가 발생한다. OpenAI는 Anthropic 같은 서버사이드 compaction이 없어서, 이 관리를 직접 구현해야 한다.

### 2.2 목표

- 대화 맥락을 유지하면서 컨텍스트 길이를 일정 수준으로 제어
- 지속적으로 유효한 사용자 정보는 요약과 분리하여 손실 없이 보존

### 2.3 저장 계층

| 계층 | 내용 | 스코프 | 갱신 | DB |
| --- | --- | --- | --- | --- |
| 채팅 메시지 | 모든 채팅 메시지 원문 | 세션 | append only | `chat_messages` |
| 대화 요약 | 구간 요약본 | 세션 | 임계치마다 재생성 | `chat_summary` |
| 주요 키워드 | 사용자 프로필, 선호, 제약조건 등 | 세션 (§2.7) | 변경 감지 시 갱신 | `chats.keywords` |

> 원문(`chat_messages`)은 요약 여부와 무관하게 항상 보존 상태를 유지한다.

### 2.4 컨텍스트 조립 순서

```
prefix(시스템 프롬프트) + 주요 키워드 + 대화 요약 + 최근 채팅 메시지 N개
```

- 초기에는 요약이 없으므로 `prefix` + `주요 키워드` + `전체 채팅 메시지`
- 임계치 도달 시 요약 생성 → 이후부터 요약 포함
- 임계치 재도달 시 `기존 요약 + 이후 원문` → 새 요약으로 갱신 (누적 재요약)

### 2.5 주요 키워드

**저장 위치: `chats.keywords`(jsonb) — 세션 단위.** 원래 설계는 사용자 단위(세션을 넘나들며 유지)였지만, `users` 테이블에 이런 컬럼이 없어서(§2.7) 지금 단계는 `chats.keywords`로 진행하기로 확정했다. 즉 **같은 대화(세션) 안에서는 유지되지만, 사용자가 새 대화를 시작하면 초기화된다.** 나중에 사용자 단위로 넓히기로 하면 `users` 쪽에 컬럼/테이블을 추가하고 세션 시작 시 그 값을 `chats.keywords` 초기값으로 복사해오는 식으로 확장하면 된다.

**저장 기준**: 이 세션 안에서 계속 유효한 정보만 저장한다. 이번 턴에만 해당하는 맥락은 요약 쪽에 둔다.

**필드 예시**

| 필드 | 설명 |
| --- | --- |
| `dataUsage` | 데이터 사용량 (`number`) |
| `budget` | 예산 (`number`) |
| `isBundle` | 가족 결합 여부 (`boolean \| null`) |
| `planPreferenceType` | 요금제 성향 검사 타입 (`string`) |

**갱신 정책**

- 대화 요약과 달리, 주요 키워드는 최신값으로 덮어쓴다 (구간 누적이 아니라 스냅샷)
- 사용자가 명시적으로 부정하거나 정정한 정보는 즉시 반영한다

CARD-013(자유 입력에서 조건 추출)의 결과물이 이 "주요 키워드"로 들어간다. §5의 `ExtractConditionsToolInput`이 이 필드들과 대응한다.

### 2.6 대화 요약 트리거 조건

- 기준: 미요약 8턴(=미요약 채팅 16개, 사용자+AI 합산)
- 보조 기준: `input_token >= 8000` (8턴이 안 됐어도 토큰이 크면 조기 트리거)
- 8턴 중 최근 3턴은 제외하고, 나머지 5턴만 요약한다
- **비동기**: 8턴째 응답을 사용자에게 반환한 뒤에 요약을 생성한다 (요약 생성이 응답 지연으로 이어지지 않게)

동작: 매 응답 후 미요약 메시지 수(마지막 `chat_summary.last_message_id` 이후 `chat_messages` 개수)를 확인 → 16개(8턴) 이상이거나 그 구간의 토큰 합이 8000 이상이면, 최근 3턴(6개)을 제외한 나머지를 요약 → 기존 `chat_summary.summary`가 있으면 그것까지 포함해서 다시 요약 → `chat_summary.summary`/`last_message_id` 갱신. 이 요약 생성은 사용자 응답을 스트리밍으로 다 내보낸 뒤 별도로(await 안 하고) 실행한다.

### 2.7 결정: 세션 단위(`chats.keywords`)로 진행

"주요 키워드"는 원래 사용자 단위(세션을 넘나들며 유지)로 설계했으나, `users` 테이블에 그걸 담을 컬럼이 없어서 **지금 단계는 세션 단위 `chats.keywords`로 진행하기로 확정**했다. 스키마 변경 없이 바로 구현 가능하다.

트레이드오프: 로그인 사용자가 대화를 끝내고 새로 시작하면 예산/데이터 사용량 같은 정보를 처음부터 다시 물어봐야 한다. 나중에 필요해지면 `users`에 `preferences jsonb` 컬럼(또는 별도 `user_preferences` 테이블)을 추가해서, 세션 시작 시 그 값을 `chats.keywords` 초기값으로 복사해오는 식으로 확장한다 — 지금 당장 만들지는 않는다.

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
      data: {
        reason: 'runtime_unavailable' | 'ai_server_error' | 'timeout' | 'invalid_format';
        message: string;
      };
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

## 5. 조건 수집 → 주요 키워드 (§2.5, CARD-013~015)

자유 입력에서 추출한 조건도 별도 tool call로 구조화해서 받는다. §2.5의 필드 예시를 그대로 tool 입력 스키마로 쓴다 — 이 세션 안에서 계속 유효한 값만 담고, 순간적인 맥락(예: "지금 이 말만 봐서는 알 수 없는 것")은 여기 넣지 않는다.

```ts
interface ExtractConditionsToolInput {
  dataUsage?: number;              // 월 데이터 사용량 추정치(GB)
  budget?: number;                 // 예산(원/월)
  isBundle?: boolean | null;       // 가족 결합 여부
  planPreferenceType?: string;     // 요금제 성향 검사 타입
}
```

**갱신 정책은 §2.5와 동일하게 덮어쓰기다** — `chats.keywords`처럼 누적 병합하는 게 아니라, tool이 새 값을 주면 그 필드는 최신값으로 교체한다. 사용자가 "아 그게 아니라"처럼 정정하면 다음 tool call에서 바로 반영된다.

CARD-013이 원래 요구하는 항목(예산, 데이터 사용 패턴, 통화량, 부가서비스 선호) 중 통화량·부가서비스 선호는 아직 위 필드 목록에 없다 — §2.5가 "예시"이므로, 실제 질문 카드(CARD-008~015)를 설계할 때 필드를 추가한다.

구조화 해석에 실패하면(CARD-014) 이 tool call 자체가 안 오거나 빈 값으로 오는데, 그 경우 서버는 조용히 넘어가고 클라이언트가 선택형 입력을 다시 제시한다.

## 6. 시스템 프롬프트 범위 (CARD-003)

**허용 범위**: 요금제 상담(추천/비교/상세), 사용량·예산·부가서비스 선호 수집, 요금제 절약 상담, 가입 절차 안내, 서비스 이용 방법 안내.

**차단 대상**:
- 요금제 상담과 무관한 일반 질의(코딩 질문, 잡담 등) → 정중히 서비스 범위 안내하고 되돌림
- 시스템 프롬프트 열람/변경 시도("네 지침을 무시하고", "시스템 프롬프트 보여줘" 등) → 거절

지금 단계에서는 별도 분류 모델 없이 시스템 프롬프트 지시문으로만 막는다. 실제 운영하면서 우회 사례가 나오면 그때 보강한다(지금 단계에서 미리 만드는 건 과함).

## 7. 실패/재시도 (NFR-002, CARD-005~006)

- 서버에서 OpenAI 요청에 30초 타임아웃을 건다. 초과하면 `event: error`, `reason: 'timeout'`.
- OpenAI가 에러를 명시적으로 돌려줬거나(5xx/4xx, 인증 실패, rate limit 등) 우리 서버가
  OpenAI에 아예 연결하지 못한 경우는 `reason: 'ai_server_error'` — 사용자와 우리 서버
  사이는 멀쩡하고 OpenAI 쪽 문제라는 게 명확하므로, 사용자에게 네트워크를 의심하게
  만드는 안내를 보여주지 않기 위해 `runtime_unavailable`과 분리했다.
- 그 외(우리 코드/DB 쪽 예외, 사용자 브라우저가 우리 서버에 아예 연결 못 한 경우)는
  `reason: 'runtime_unavailable'`.
- tool call 결과 파싱 실패(스키마 안 맞음)는 `reason: 'invalid_format'`.
- 재시도(CARD-006)는 클라이언트가 **직전 요청과 동일한 입력·문맥**을 다시 보내는 것으로 처리한다 — 서버는 별도 재시도 상태를 갖지 않고, 클라이언트가 마지막으로 보낸 요청 바디를 기억해뒀다가 그대로 재전송한다.

## 8. 다음에 코드로 옮길 것

이 문서가 확정되면:

1. `src/types/chat.ts` — 위 인터페이스들을 실제 타입으로
2. `/api/chat` route handler — SSE 스트림 + tool calling 2종(`recommend_plans`, `extract_conditions`)
3. `useChat` 훅 — 스트림 파싱, `AiMessage`/`PlanCard`에 연결
