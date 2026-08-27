# Supabase DB 스키마

Supabase(PostgreSQL) 기준 전체 스키마. RLS(Row Level Security)가 모든 테이블에 활성화되어 있으며, 마스터 데이터는 누구나 조회 가능하고 사용자 데이터는 본인 행만 접근 가능하다.

## 1. 마스터 데이터

### `plans` — 요금제

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | integer | PK |
| `name` | varchar(100) | 요금제명 (예: 너겟26) |
| `description` | varchar(100) | 한 줄 설명 |
| `monthly_fee` | integer | 월 요금(원, 부가세 포함) |
| `data_allowance` | varchar(100) | 데이터 제공량 표시 문구 (소진 후 속도·무제한 여부 포함) |
| `voice_sms` | varchar(100) | 음성/문자 제공량 표시 문구 |
| `benefits` | jsonb | 부가 혜택 |
| `created_at` | timestamptz | 생성 일시 |

DATA-001~002의 요금제 마스터 데이터. **추천 요금제 카드(CARD-016~017)에 들어가는 요금제명·월요금·데이터·음성·문자·혜택은 전부 이 테이블에서 그대로 가져와야 하며, LLM이 이 값을 생성하면 안 된다(CARD-001~002, NFR-003~004).**

### `add_ons` — 부가서비스

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | integer | PK |
| `title` | varchar(100) | 부가서비스명 (예: 안심옵션) |
| `sub_title` | varchar(100) | 부제목 |
| `base_monthly_rate` | integer | 기본 월 금액(원) — 일할 계산 기준액 |
| `description` | varchar(255) | 설명 |
| `created_at` | timestamptz | 생성 일시 |

### `subscriptions` — 구독 상품

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | integer | PK |
| `name` | varchar(100) | 구독 상품명 (예: 넷플릭스 팩) |
| `base_monthly_fee` | integer | 기본 월 요금(원) |
| `discount` | integer | 할인율(%, 예: 30 → 30%) |
| `highlight` | varchar(100) | 강조 문구 |
| `description` | varchar(255) | 설명 |
| `created_at` | timestamptz | 생성 일시 |

### `membership_brands` — 멤버십 제휴 브랜드

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | varchar(50) | PK (예: B001) |
| `name` | varchar(100) | 브랜드명 (카카오맵 검색 키워드로도 사용) |
| `category` | varchar(50) | 카테고리 |
| `discount_rules` | jsonb | 할인 정보 (예: `{"type": "percent", "value": 10}`) |
| `icon` | varchar(50) | 아이콘 식별자 |
| `created_at` | timestamptz | 생성 일시 |

지점 위치는 이 테이블에 없고 카카오맵 키워드 검색으로 조회한다.

### `missions` — 미션

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | integer | PK |
| `code` | varchar(50) | 미션 코드 (예: DAILY_CHECK_IN), unique |
| `title` | varchar(100) | 미션명 |
| `description` | varchar(255) | 설명 |
| `reward_point` | integer | 완료 시 지급 포인트 |
| `period` | varchar(20) | `DAILY`(하루 1회) / `ONCE`(계정당 1회) |
| `created_at` | timestamptz | 생성 일시 |

## 2. 사용자

### `users` — 사용자 프로필

`auth.users`와 1:1, 카카오 로그인 후 추가 정보 입력 시 생성(AUTH-006~009).

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | PK, `auth.users.id`와 동일 값 |
| `name` | varchar(50) | 이름 |
| `contact` | varchar(20) | 연락처 |
| `current_plan_id` | integer | FK → `plans.id`, 현재 이용 요금제 |
| `birth` | date | 생년월일 |
| `gender` | varchar(10) | `MALE` / `FEMALE` / `OTHER` |
| `remaining_data` | integer | 이번 달 남은 데이터(MB) |
| `data_limit` | integer | 이번 달 데이터 제공량(MB) |
| `point` | integer | 보유 포인트 (`point_history` 합계와 일치해야 함, NFR-013) |
| `created_at` / `updated_at` | timestamptz | 생성/수정 일시 |

**챗봇 문맥에 포함할 정보(CHAT-010, CARD-023~024).** `current_plan_id`로 `plans` 조인해서 현재 요금제 정보를, `remaining_data`/`data_limit`으로 잔여 사용량을 상담 문맥에 넣는다.

### `user_add_ons` / `user_subscriptions` — 가입 내역

사용자별 부가서비스·구독 가입 내역. `status`(`ACTIVE`/`CANCELED`, 구독은 `PAUSED`도 있음)로 현재 이용 중인 항목을 가른다. 개인화 카드(CARD-027~028)의 "부가서비스 추천, 구독 상품 추천" 판단에 현재 가입 여부를 확인할 때 쓴다.

### `user_monthly_usage` — 월별 데이터 사용량

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | integer | PK |
| `user_id` | uuid | FK |
| `billing_month` | varchar(7) | 집계 월 (예: `2026-05`) |
| `data_used_mb` | integer | 사용한 데이터 총량(MB) |

사용자당 월 1건. **CARD-028 "최근 3개월 데이터 사용량" 개인화 카드**에 직접 쓰인다. 최근 3건을 `billing_month desc`로 조회하면 됨.

### `user_missions` / `point_history` / `user_event_logs`

미션 수행 내역(중복 적립 방지 unique 제약), 포인트 적립/사용 내역, 활동 로그(요금제 변경·부가서비스 가입 등 이벤트, `event_type` + `event_details` jsonb). `user_event_logs`는 ANALYSIS-001~003(활동 기록 → 추천 산출/상담 문맥 반영)의 데이터 소스다.

## 3. 채팅

**비회원 대화는 DB에 저장하지 않고 클라이언트에만 임시 저장한다(CHAT-011). 아래 세 테이블은 로그인 사용자 전용이며, 로그인 시점에 클라이언트에 있던 대화를 승계해서 생성한다.**

### `chats` — 채팅 세션

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK, 소유자 |
| `keywords` | jsonb | **대화에서 수집한 사용자 조건 키워드(요금제 성향 검사 결과 포함)** |
| `created_at` | timestamptz | 세션 시작 일시 |

`keywords`가 **CARD-013 "자유 입력에서도 조건을 추출해 구조화 형식으로 저장"**이 실제로 저장되는 자리다. 예산, 데이터 사용량, 통화 성향 같은 구조화된 조건을 여기 누적한다.

### `chat_messages` — 메시지

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | bigint | PK |
| `chat_id` | uuid | FK |
| `sender_type` | varchar(10) | `USER` / `AI` |
| `content` | text | 대화 내용(텍스트 및 카드 데이터) |
| `created_at` | timestamptz | 생성 일시 |

`content`가 `text` 타입이라, 카드 데이터를 포함할 때는 JSON을 문자열로 직렬화해서 넣는 형태가 된다(별도 컬럼 없음).

### `chat_summary` — 대화 요약

세션당 1건. `summary`(요약 텍스트) + `last_message_id`(요약에 반영된 마지막 메시지)로, 대화가 길어질 때 LLM에 매번 전체 이력을 보내는 대신 요약을 대신 보내는 용도. OpenAI는 Anthropic 같은 서버사이드 compaction이 없어서, 이 필드로 직접 구현해야 한다.

## 4. RLS 요약

- 마스터 데이터(`plans`, `add_ons`, `subscriptions`, `membership_brands`, `missions`): 읽기는 전체 공개, 쓰기는 `service_role`만
- 사용자 데이터: 전부 `auth.uid() = user_id` (또는 `users.id`) 조건으로 본인 행만
- `chat_messages`/`chat_summary`: 직접 `user_id`가 없고, 부모 `chats.user_id`로 소유권 확인 (`exists` 서브쿼리)
