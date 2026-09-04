# 🐙 **무너랑** (Moonorang)

> 요금제 가입을 위한 AI 채팅 서비스

**LLM 기반 상담을 통해 사용자에게 맞는 이동통신 요금제를 추천하고, 가입 신청까지 연결하는 웹 서비스입니다.**

<br>

## 🌟 프로젝트 개요

### 📱 플랫폼

모바일 우선 반응형 웹 어플리케이션

### 목적

요금제는 데이터 제공량, 통화량, 부가 혜택 등 고려해야 할 요소가 많아 일반 사용자가 자신에게 적합한 상품을 판단하기 어렵습니다. 또한 요금제를 정한 뒤에도 부가서비스, 구독 상품, 멤버십 혜택이 각기 다른 화면에 흩어져 있어 자신에게 맞는 조합을 찾기까지 여러 단계를 거쳐야 합니다.

무너랑은 통신사의 요금제 가입 상담 서비스를 가정하여, 사용자가 채팅을 통해 가입 조건을 입력하고 LLM의 상담 응답을 확인한 뒤 추천 요금제를 선택해 가입까지 **하나의 대화 흐름 안에서** 진행할 수 있는 서비스를 구현합니다.

<br>

## 🚀 주요 기능

### 1. AI 상담

| 기능 | 설명 |
|---|---|
| 프론티어 LLM 실시간 채팅 | OpenAI GPT-4o mini를 서버 경유 프록시로 연동하고, 생성된 응답을 SSE로 토큰 단위 스트리밍하여 실시간 표시 |
| 응답 상태 관리 및 예외 처리 | 대기, 생성 중, 완료, 실패로 응답 상태를 관리하며 실패 시 사유(런타임 미동작 / AI 서버 오류 / 응답 시간 초과 / 응답 형식 오류)를 구분해 안내하고 재시도 제공. 응답 대기 30초 제한 및 생성 중단 지원 |
| 대화형 조건 수집 | 선택형 질문 카드와 자유 입력을 통해 예산, 데이터 사용량, 테더링 사용량, 관심사를 수집하고 구조화하여 저장. "밖에서 유튜브 보는 정도" 같은 생활 패턴 표현도 수치로 추정 |
| 대화 내역 관리 | 비회원 대화는 브라우저에만 저장하고 회원 대화는 DB에 저장·복구. 로그인 시 비회원 대화를 회원 계정으로 승계하며, 대화가 길어지면 자동 요약해 컨텍스트 관리 |
| 요금제 절약 상담 | 로그인 사용자의 현재 요금제와 실사용 데이터를 분석해 절약 / 유지 / 상향을 판단하고 근거와 예상 절감액을 함께 제시 |

### 2. 요금제 및 상품

| 기능 | 설명 |
|---|---|
| 상품 데이터 구성 및 조회 | 요금제 11종을 비롯해 부가서비스, 구독 상품, 멤버십 제휴 브랜드 데이터를 구성하고 상품·혜택 목록에서 탭으로 조회. 각 항목 상세는 전체 화면 모달로 제공 |
| 조건 기반 추천 및 카드 표시 | 수집된 조건에 대한 점수 산정으로 요금제를 선별하여 최대 3개를 카드로 표시하고, 추천 순위와 선정 이유를 함께 제공 |
| 채팅 내 단계별 가입 절차 | 가입 카드를 대화 흐름 안에 삽입해 단계별로 진행. 요금제는 상세 확인 → 약관 동의 → 본인 확인 → 카드 등록 → 결제 정보 5단계, 부가서비스는 3단계, 구독 상품은 4단계로 상품 성격에 맞게 구성 |
| 본인 인증 및 약관 동의 | 문자 메시지(SMS)를 서비스사 쪽으로 직접 전송해 본인 또는 기기 소유를 확인하는 MO 인증 방식을 OCTOMO API로 연동하고, QR 코드 / SMS 인증 탭 제공. 카드사, 카드 번호, 유효기간은 더미 데이터로 처리 |
| 가입 및 변경 분기 처리 | 회원은 요금제 변경, 비회원은 가입 완료 후 카카오 회원가입으로 분기. 이미 이용 중인 상품은 절차 시작 전 안내로 중복 가입 차단 |

### 3. 개인화 추천

| 기능 | 설명 |
|---|---|
| 사용 이력 기반 AI 조언 | 최근 3개월 데이터 사용량 추이를 차트로 분석하고, 이를 근거로 대안 요금제를 카드 형식으로 추천 |
| 취미 성향 검사 | 5개 객관식 문항 응답을 점수화해 4가지 성향 유형 중 하나를 판정하고, DB 기반 추천 요금제와 혜택을 제시하며 결과를 공유 가능 |
| 부가서비스 · 구독 상품 추천 | 대화에서 추출한 관심사 키워드와 실제 이용률을 기준으로 어울리는 부가서비스와 구독 상품을 카드 형식으로 추천 |
| 활동 기록 반영 | 성향 검사 결과와 상품 가입 이력을 기록하고, 이를 추천 순위 산정과 상담 문맥에 반영 |

### 4. 회원 및 혜택

| 기능 | 설명 |
|---|---|
| 로그인 및 마이페이지 | 카카오 간편 로그인으로 회원을 등록하고, 마이페이지에서 현재 요금제, 이번 달 사용량, 이용 중인 부가서비스, 멤버십 바코드를 조회 |
| 위치 기반 멤버십 제휴사 지도 | 브라우저 위치 권한과 카카오 로컬 API를 연동해 현재 위치 기준 인근 제휴사를 검색하고, 전체 화면 지도에 현재 위치와 함께 표시하며 혜택 정보 제공 |

### 5. 사용자 경험

| 기능 | 설명 |
|---|---|
| 최초 방문 튜토리얼 | 단계별로 서비스 이용 방법을 안내하고, 완료 또는 건너뛰기 여부를 저장해 재방문 시 다시 표시하지 않음 |
| 스켈레톤 UI | 페이지 및 모달 로딩 시 자연스러운 시각적 표현을 위한 스켈레톤 UI 구현 |
| 모바일 대응 | 최소 너비 375px 기준으로 가로 스크롤 없이 모든 기능을 이용할 수 있도록 단일 열 레이아웃 구성 |

<br>

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, React Hook Form + Zod, Framer Motion |
| Backend / Database | Supabase (PostgreSQL, RLS) |
| Authentication | Supabase Auth + OAuth 2.0 (Kakao) |
| AI / LLM | OpenAI GPT-4o mini (Chat Completions API — SSE 스트리밍, Function Calling) |
| External API | Kakao Map SDK, Kakao Local API, OCTOMO (MO 본인 인증) |
| 협업 도구 | Notion, Jira, Figma, GitHub, Slack, ERDCloud |
| 코드 품질 | ESLint, Prettier |

<br>

## 🧩 시스템 아키텍처

### 1. LLM 접근은 반드시 서버를 경유합니다

클라이언트는 LLM 런타임에 직접 접근하지 않고 애플리케이션 서버를 경유합니다.

- API 키의 클라이언트 노출 차단
- 시스템 프롬프트 및 모델 설정의 클라이언트 노출 차단
- 요청 빈도 제한 및 타임아웃 정책의 서버 측 일괄 적용
- 사용자 데이터 주입과 응답 후처리를 서버 단일 지점에서 처리

### 2. 사실 정보는 LLM이 생성하지 않습니다

요금제명, 월 요금, 데이터 제공량 같은 **사실 정보와 추천 순위 산정은 전부 서버가 보유 데이터로 직접 계산**하고, LLM은 그 결과를 설명하는 역할만 담당합니다.

LLM이 호출하는 도구는 요금제 ID조차 지정하지 않고 "지금 추천할 시점"이라는 의도 신호만 전달하며, 실제 선별과 순위는 서버가 수행합니다. 이를 통해 실제 상품 정보와 어긋나는 응답을 원천적으로 차단하고, 동일한 조건에 대해 항상 동일한 추천 결과를 보장합니다.

<br>

## 👥 팀원 소개
<table>
  <thead>
    <tr>
      <th width="33%" align="center">이규태</th>
      <th width="33%" align="center">이주현</th>
      <th width="33%" align="center">장준환</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="https://github.com/Ourumo.png" width="100%"/></td>
      <td align="center"><img src="https://github.com/hana03030.png" width="100%"/></td>
      <td align="center"><img src="https://github.com/junhwan0697.png" width="100%"/></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/Ourumo">@Ourumo</a></td>
      <td align="center"><a href="https://github.com/hana03030">@hana03030</a></td>
      <td align="center"><a href="https://github.com/junhwan0697">@junhwan0697</a></td>
    </tr>
    <tr>
      <td align="center">인증 · 상품 데이터 · 상품 목록 화면</td>
      <td align="center">디자인 시스템 · LLM 연동 · 개인화 추천</td>
      <td align="center">가입 절차 · 본인 인증 · 성향 검사</td>
    </tr>
  </tbody>
</table>

<br>

## 💻 포팅 매뉴얼

### 요구 사항

- Node.js 20 이상
- OpenAI API 키
- Supabase 프로젝트
- Kakao Developers 애플리케이션 (로그인, 지도, 로컬 API)
- OCTOMO API 키 (MO 본인 인증)

### 설치

```bash
# 저장소 클론
git clone https://github.com/Moonorang/moonorang.git
cd moonorang

# 의존성 설치
npm install
```

### 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Kakao
NEXT_PUBLIC_KAKAO_MAP_KEY=
KAKAO_REST_API_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=          # 선택, 미설정 시 gpt-4o-mini

# OCTOMO (MO 본인 인증)
OCTOMO_API_KEY=
```

### 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

<br>

## 📁 프로젝트 구조

도메인 기반 4레이어 구조를 따릅니다. 자세한 규칙은 [docs/projectStructure.md](docs/projectStructure.md)를 참고하세요.

```
moonorang/
├── docs/                   # 요구사항 명세, 코드 컨벤션, DB 스키마, 채팅 API 설계
├── public/
└── src/
    ├── app/                # Next.js 라우팅 및 앱 셸
    │   ├── (chat)/         # 채팅 상담 (홈)
    │   ├── api/            # LLM 프록시, 대화 관리, MO 인증 라우트
    │   ├── auth/           # 카카오 로그인 · 회원가입 · OAuth 콜백
    │   ├── catalog/        # 상품 · 혜택 목록
    │   ├── mypage/         # 마이페이지
    │   ├── test/           # 취미 성향 검사 결과
    │   ├── _header/        # 헤더
    │   ├── _splash/        # 스플래시 화면
    │   └── _tutorial/      # 최초 방문 튜토리얼
    ├── features/           # 사용자 행동 단위 기능
    │   ├── chat/           # 채팅, LLM 연동, 추천 산출
    │   ├── join/           # 요금제 · 부가서비스 · 구독 가입 절차
    │   ├── auth/           # 인증 및 회원가입
    │   ├── catalog/        # 상품 목록 화면
    │   ├── test/           # 취미 성향 검사
    │   ├── usage/          # 사용량 분석
    │   └── mypage/         # 마이페이지
    ├── entities/           # 여러 기능이 공유하는 도메인
    │   ├── plan/           # 요금제
    │   ├── addOn/          # 부가서비스
    │   ├── subscription/   # 구독 상품
    │   ├── membershipBrand/# 멤버십 제휴 브랜드
    │   ├── user/           # 사용자
    │   ├── chat/           # 채팅
    │   ├── join/           # 가입
    │   └── usage/          # 사용량
    └── shared/             # 도메인 지식이 없는 공통 자원
        ├── ui/             # Button, Modal, TextField 등 공통 컴포넌트
        ├── lib/            # Supabase · OpenAI · Kakao 클라이언트
        ├── hooks/          # 공통 훅
        ├── utils/          # 포맷팅, 클래스 병합 등 순수 함수
        ├── styles/         # 전역 스타일 및 디자인 토큰
        └── fonts/
```

### 레이어 간 의존 방향

```
app       →  features, entities, shared    전부 가능
features  →  entities, shared              (다른 feature 참조 ❌)
entities  →  shared                        (feature 참조 ❌)
shared    →  shared                        (상위 레이어 참조 ❌)
```
