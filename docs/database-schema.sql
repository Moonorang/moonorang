-- =========================================================
--  무너랑(Moonorang) DB 스키마
--  Supabase (PostgreSQL) 전용
--
--  이 파일은 실제 실행 이력이 아니라 참고용 스냅샷이다.
--  docs/database-schema.md 는 이 파일을 사람이 읽기 쉽게 요약한 문서이며,
--  값이 어긋나면 이 SQL을 원본으로 삼는다.
-- =========================================================


-- =========================================================
--  0. 공통 함수
-- =========================================================

-- updated_at 컬럼을 현재 시각으로 자동 갱신하는 트리거 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================================
--  1. 마스터 데이터
-- =========================================================

-- 요금제 마스터
create table public.plans (
  -- 요금제 아이디
  id             integer      generated always as identity primary key,
  -- 요금제명 (예: 너겟26)
  name           varchar(100) not null,
  -- 요금제 한 줄 설명
  description    varchar(100) not null,
  -- 월 요금 (원, 부가세 포함)
  monthly_fee    integer      not null,
  -- 데이터 제공량 표시 문구 (소진 후 속도·무제한 여부 포함)
  data_allowance varchar(100) not null,
  -- 음성/문자 제공량 표시 문구
  voice_sms      varchar(100) not null,
  -- 부가 혜택 (미디어 혜택 등)
  benefits       jsonb,
  -- 생성 일시
  created_at     timestamptz  not null default now()
);


-- 부가서비스 마스터
create table public.add_ons (
  -- 부가서비스 아이디
  id                integer      generated always as identity primary key,
  -- 부가서비스명 (예: 안심옵션)
  title             varchar(100) not null,
  -- 부가서비스 부제목
  sub_title         varchar(100) not null,
  -- 기본 월 금액 (원, 일할 계산의 기준액)
  base_monthly_rate integer      not null,
  -- 부가서비스 설명
  description       varchar(255),
  -- 생성 일시
  created_at        timestamptz  not null default now()
);


-- 구독 상품 마스터 (매월 별도 결제)
create table public.subscriptions (
  -- 구독 상품 아이디
  id               integer      generated always as identity primary key,
  -- 구독 상품명 (예: 넷플릭스 팩)
  name             varchar(100) not null,
  -- 기본 월 요금 (원)
  base_monthly_fee integer      not null,
  -- 할인율 값 (퍼센트로 환산해 사용, 예: 30 → 30%)
  discount         integer      not null default 0,
  -- 상품 설명 강조 문구
  highlight        varchar(100),
  -- 상품 설명
  description      varchar(255),
  -- 생성 일시
  created_at       timestamptz  not null default now()
);


-- 멤버십 제휴 브랜드 (지점 위치는 카카오맵 키워드 검색으로 조회)
create table public.membership_brands (
  -- 브랜드 아이디 (예: B001)
  id             varchar(50)  primary key,
  -- 브랜드명 (카카오맵 검색 키워드로도 사용)
  name           varchar(100) not null,
  -- 카테고리
  category       varchar(50)  not null,
  -- 할인 정보 (예: {"type": "percent", "value": 10})
  discount_rules jsonb        not null,
  -- 아이콘 식별자
  icon           varchar(50)  not null,
  -- 생성 일시
  created_at     timestamptz  not null default now()
);


-- 미션 마스터 (출석체크 등)
create table public.missions (
  -- 미션 아이디
  id           integer      generated always as identity primary key,
  -- 미션 코드 (예: DAILY_CHECK_IN, 코드로 조회)
  code         varchar(50)  not null unique,
  -- 미션명
  title        varchar(100) not null,
  -- 미션 설명
  description  varchar(255),
  -- 완료 시 지급 포인트
  reward_point integer      not null,
  -- 반복 주기 | DAILY(하루 1회) / ONCE(계정당 1회)
  period       varchar(20)  not null default 'DAILY'
                            check (period in ('DAILY', 'ONCE')),
  -- 생성 일시
  created_at   timestamptz  not null default now()
);


-- =========================================================
--  2. 사용자
-- =========================================================

-- 사용자 프로필 (auth.users와 1:1, 카카오 로그인 후 추가 정보 입력 시 생성)
create table public.users (
  -- 사용자 아이디 (auth.users.id와 동일한 값을 그대로 사용)
  id              uuid         primary key references auth.users (id) on delete cascade,
  -- 이름 (가입 시 추가 입력)
  name            varchar(50),
  -- 연락처 (가입 시 추가 입력)
  contact         varchar(20),
  -- 현재 이용 요금제
  current_plan_id integer      references public.plans (id) on delete set null,
  -- 생년월일
  birth           date,
  -- 성별 | MALE / FEMALE / OTHER
  gender          varchar(10)  check (gender in ('MALE', 'FEMALE', 'OTHER')),
  -- 이번 달 남은 데이터 (MB)
  remaining_data  integer      not null default 0,
  -- 이번 달 데이터 제공량 (MB)
  data_limit      integer,
  -- 보유 포인트 (point_history 합계와 일치해야 함)
  point           integer      not null default 0 check (point >= 0),
  -- 가입 일시
  created_at      timestamptz  not null default now(),
  -- 수정 일시 (트리거 자동 갱신)
  updated_at      timestamptz  not null default now()
);

create index on public.users (current_plan_id);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();


-- 사용자별 부가서비스 가입 내역 (요금제에 합산, 일할 계산)
create table public.user_add_ons (
  -- 가입 내역 아이디
  id         integer     generated always as identity primary key,
  -- 사용자 아이디
  user_id    uuid        not null references public.users (id) on delete cascade,
  -- 부가서비스 아이디
  add_on_id  integer     not null references public.add_ons (id) on delete restrict,
  -- 상태 | ACTIVE / CANCELED
  status     varchar(20) not null default 'ACTIVE'
                         check (status in ('ACTIVE', 'CANCELED')),
  -- 이용 시작일 (일할 계산 기준일)
  started_at date        not null default current_date,
  -- 이용 종료일 (해지 시 기록, 일할 정산에 사용)
  ended_at   date,
  -- 생성 일시
  created_at timestamptz not null default now(),
  -- 수정 일시 (트리거 자동 갱신)
  updated_at timestamptz not null default now()
);

create index on public.user_add_ons (user_id);

-- 같은 부가서비스를 중복으로 이용 중인 상태가 되지 않도록 방지
create unique index uq_user_add_ons_active
  on public.user_add_ons (user_id, add_on_id) where status = 'ACTIVE';

create trigger trg_user_add_ons_updated_at
  before update on public.user_add_ons
  for each row execute function public.set_updated_at();


-- 사용자별 구독 상품 가입 내역 (개별 결제)
create table public.user_subscriptions (
  -- 가입 내역 아이디
  id                integer     generated always as identity primary key,
  -- 사용자 아이디
  user_id           uuid        not null references public.users (id) on delete cascade,
  -- 구독 상품 아이디
  subscription_id   integer     not null references public.subscriptions (id) on delete restrict,
  -- 다음 결제일 (PAUSED 상태로 이 날짜가 지나면 CANCELED 처리)
  next_billing_date date        not null,
  -- 구독 상태 | ACTIVE / PAUSED / CANCELED
  status            varchar(20) not null default 'ACTIVE'
                                check (status in ('ACTIVE', 'PAUSED', 'CANCELED')),
  -- 가입 일시
  created_at        timestamptz not null default now()
);

create index on public.user_subscriptions (user_id);

-- 해지되지 않은 동일 구독 상품의 중복 가입 방지
create unique index uq_user_subscriptions_active
  on public.user_subscriptions (user_id, subscription_id) where status <> 'CANCELED';


-- 사용자 월별 데이터 사용량 (최근 3개월 기반 추천에 사용)
create table public.user_monthly_usage (
  -- 집계 아이디
  id            integer     generated always as identity primary key,
  -- 사용자 아이디
  user_id       uuid        not null references public.users (id) on delete cascade,
  -- 집계 월 (예: 2026-05)
  billing_month varchar(7)  not null check (billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- 사용한 데이터 총량 (MB)
  data_used_mb  integer     not null default 0,
  -- 집계 생성 일시
  created_at    timestamptz not null default now(),
  -- 사용자당 월 1건
  unique (user_id, billing_month)
);


-- 미션 수행 내역 (UNIQUE 제약으로 중복 적립 차단)
create table public.user_missions (
  -- 수행 내역 아이디
  id             integer     generated always as identity primary key,
  -- 사용자 아이디
  user_id        uuid        not null references public.users (id) on delete cascade,
  -- 미션 아이디
  mission_id     integer     not null references public.missions (id) on delete cascade,
  -- 수행 일자 (하루 1회 제한 기준)
  completed_date date        not null default current_date,
  -- 수행 일시
  created_at     timestamptz not null default now(),
  -- 같은 미션을 같은 날 두 번 적립하지 못하도록 제한
  unique (user_id, mission_id, completed_date)
);

create index on public.user_missions (user_id, completed_date desc);


-- 포인트 적립/사용 내역
create table public.point_history (
  -- 내역 아이디
  id            bigint       generated always as identity primary key,
  -- 사용자 아이디
  user_id       uuid         not null references public.users (id) on delete cascade,
  -- 변동 금액 | 적립(양수) / 사용(음수)
  amount        integer      not null,
  -- 내역 구분 | EARN / USE
  type          varchar(20)  not null check (type in ('EARN', 'USE')),
  -- 변동 사유 (예: 출석체크, 가입 보상)
  reason        varchar(100) not null,
  -- 변동 후 잔액 (users.point 검증용)
  balance_after integer      not null,
  -- 발생 일시
  created_at    timestamptz  not null default now()
);

create index on public.point_history (user_id, created_at desc);


-- 사용자 활동 로그 (요금제·부가서비스 변경, 구독 결제 이력 등 추천 근거 데이터)
create table public.user_event_logs (
  -- 로그 아이디
  id            bigint      generated always as identity primary key,
  -- 사용자 아이디
  user_id       uuid        not null references public.users (id) on delete cascade,
  -- 이벤트 타입 (예: PLAN_CHANGE, ADD_ON_JOIN, SUBSCRIPTION_PAID)
  event_type    varchar(50) not null,
  -- 상세 내역 (변경 전/후 값, 결제 금액 등)
  event_details jsonb,
  -- 이벤트 발생 일시
  created_at    timestamptz not null default now()
);

create index on public.user_event_logs (user_id, created_at desc);
create index on public.user_event_logs (event_type, created_at desc);


-- =========================================================
--  3. 채팅 (비회원 대화는 클라이언트 임시 저장, DB에는 회원만)
-- =========================================================

-- 채팅 세션 (회원 전용, 비회원 대화는 로그인 후 승계 시점에 생성)
create table public.chats (
  -- 채팅 세션 아이디
  id         uuid        primary key default gen_random_uuid(),
  -- 사용자 아이디
  user_id    uuid        not null references public.users (id) on delete cascade,
  -- 대화에서 수집한 사용자 조건 키워드 (요금제 성향 검사 결과 포함)
  keywords   jsonb       not null default '{}'::jsonb,
  -- 세션 시작 일시
  created_at timestamptz not null default now()
);

create index on public.chats (user_id, created_at desc);


-- 채팅 메시지
create table public.chat_messages (
  -- 메시지 아이디
  id          bigint      generated always as identity primary key,
  -- 채팅 세션 아이디
  chat_id     uuid        not null references public.chats (id) on delete cascade,
  -- 발신자 | USER / AI
  sender_type varchar(10) not null check (sender_type in ('USER', 'AI')),
  -- 대화 내용 (텍스트 및 카드 데이터)
  content     text        not null,
  -- 생성 일시
  created_at  timestamptz not null default now()
);

create index on public.chat_messages (chat_id, created_at);


-- LLM 컨텍스트용 대화 요약 (세션당 1건, 실패 시 다음 턴에 재시도)
create table public.chat_summary (
  -- 요약 아이디
  id              integer     generated always as identity primary key,
  -- 채팅 세션 아이디
  chat_id         uuid        not null unique references public.chats (id) on delete cascade,
  -- 대화 요약 내용
  summary         text        not null,
  -- 요약에 반영된 마지막 메시지 아이디
  last_message_id bigint      references public.chat_messages (id) on delete set null,
  -- 생성 일시
  created_at      timestamptz not null default now(),
  -- 갱신 일시 (트리거 자동 갱신)
  updated_at      timestamptz not null default now()
);

create trigger trg_chat_summary_updated_at
  before update on public.chat_summary
  for each row execute function public.set_updated_at();


-- =========================================================
--  4. RLS
--  Supabase는 테이블이 곧 API이므로 활성화 필수
-- =========================================================

-- 마스터 데이터: 비회원 포함 누구나 읽기 가능, 쓰기는 service_role만
alter table public.plans             enable row level security;
alter table public.add_ons           enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.membership_brands enable row level security;
alter table public.missions          enable row level security;

create policy plans_select             on public.plans             for select using (true);
create policy add_ons_select           on public.add_ons           for select using (true);
create policy subscriptions_select     on public.subscriptions     for select using (true);
create policy membership_brands_select on public.membership_brands for select using (true);
create policy missions_select          on public.missions          for select using (true);

-- 사용자 프로필: 본인 행만 접근 (로그인 후 추가 정보 입력 시 직접 insert)
alter table public.users enable row level security;

create policy users_all on public.users for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- 사용자 데이터: 본인 행만 접근
alter table public.user_add_ons       enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.user_monthly_usage enable row level security;
alter table public.user_missions      enable row level security;
alter table public.point_history      enable row level security;
alter table public.user_event_logs    enable row level security;
alter table public.chats              enable row level security;

create policy user_add_ons_all on public.user_add_ons for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_subscriptions_all on public.user_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_monthly_usage_all on public.user_monthly_usage for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_missions_all on public.user_missions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy point_history_all on public.point_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_event_logs_all on public.user_event_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy chats_all on public.chats for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 채팅 하위 테이블: 세션 소유자만 접근
alter table public.chat_messages enable row level security;
alter table public.chat_summary  enable row level security;

create policy chat_messages_all on public.chat_messages for all
  using (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));

create policy chat_summary_all on public.chat_summary for all
  using (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));
