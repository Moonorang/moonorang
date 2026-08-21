# 🐙 **무너랑** (Moonorang)

> 요금제 가입을 위한 AI 채팅 서비스

로컬 LLM 기반 상담을 통해 사용자에게 맞는 이동통신 요금제를 추천하고, 가입 신청까지 연결하는 웹 서비스입니다.

<br>

## 🌟 프로젝트 개요

### 📱 플랫폼

모바일 우선 반응형 웹 어플리케이션

### 목적

요금제는 데이터 제공량, 통화량, 약정 조건 등 고려해야 할 요소가 많아 일반 사용자가 자신에게 적합한 상품을 판단하기 어렵습니다.

무너랑은 통신사의 요금제 가입 상담 서비스를 가정하여, 사용자가 채팅을 통해 가입 조건을 입력하고 LLM의 상담 응답을 확인한 뒤 추천 요금제를 선택해 가입까지 진행할 수 있는 서비스를 구현합니다.

<br>

## 🚀 주요 기능

### 상담

| 기능 | 설명 |
|---|---|
| 로컬 LLM 실시간 채팅 | Ollama 기반 로컬 LLM을 서버 경유 프록시로 연동하고, 응답을 토큰 단위로 스트리밍하여 실시간 표시 |
| 대화형 조건 수집 | 선택형 질문 카드와 자유 입력으로 데이터 사용량·통화량·예산·부가서비스 선호를 수집하고 구조화 저장 |
| 응답 상태 관리 | 대기·생성 중·완료·실패 상태를 관리하고, 실패 사유를 구분하여 안내 및 재시도 처리 |
| 요금제 가입 상담 | 로컬 LLM 실시간 채팅 기반으로 사용자에게 맞는 요금제를 추천하고, 최종 가입까지 연결 |
| 요금제 절약 상담 | 현재 이용 요금제와 사용량을 분석해 절감 여지를 판단하고, 예상 절감액을 월, 연 단위로 산출 |

### 요금제

| 기능 | 설명 |
|---|---|
| 요금제 조회 | 월 요금, 데이터 제공량, 통화량, 부가 혜택을 포함한 요금제 11종의 목록 및 상세 정보 제공 |
| 조건 기반 추천 | 수집된 조건에 대한 점수 산정으로 요금제를 선별하여 최대 3개를 카드로 표시, 순위와 선정 이유 제공 |
| 가입 신청 | 선택한 요금제에 대해 신청 정보를 입력받고 신청 완료까지 연결되는 단계형 흐름 |

### 개인화 추천

| 기능 | 설명 |
|---|---|
| 활동 기록 기반 추천 | 요금제·부가서비스·구독의 가입 및 변경 이력을 이벤트로 기록하여 추천 산출과 상담 문맥에 반영 |
| 요금 이력 기반 조언 | 최근 3개월의 월별 요금과 사용량 추이를 분석하여 변동 요인을 파악하고 상담으로 연결 |
| 구독 상품 추천 | 사용자 활동과 성향 검사 결과를 기준으로 어울리는 구독형 상품을 추천 |
| 부가서비스 추천 | 동일 연령대에서 이용 비율이 높은 부가서비스를 분석하여 추천 |

### 이해 지원

| 기능 | 설명 |
|---|---|
| 쉬운 모드 | 글자 크기 확대, 고대비 색상 전환, 어려운 통신 용어에 대한 설명 제공 |
| 음성 입력·안내 | 음성으로 질문을 입력하고(STT), 상담 응답을 음성으로 읽어주는 기능(TTS) 제공 |

### 회원 및 혜택

| 기능 | 설명 |
|---|---|
| 회원 인증 및 마이페이지 | 카카오 간편 로그인으로 회원을 등록하고, 현재 요금제와 이용 중인 서비스 목록을 조회 |
| 요금제 성향 검사 | 객관식 문항 응답을 점수화하여 성향 유형을 판정하고, 추천 요금제와 이용 조건을 제시 |
| 미션·출석 체크 | 일일 출석 체크와 상시 미션을 제공하고 보상으로 포인트를 지급 |
| 포인트 | 미션 및 요금 납부 시 포인트를 적립하고, 멤버십 혜택 사용에 활용 |
| 멤버십 가맹점 지도 | 현재 위치 기준으로 인근 멤버십 제휴 가맹점을 지도에 표시하고 혜택 정보 제공 |

<br>

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Zustand |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth + OAuth 2.0 (Kakao) |
| AI / LLM | Ollama (llama3.2), STT / TTS |
| External API | KakaoMap API |
| 협업 | Notion, Jira, Figma, GitHub, Slack, ERDCloud |
| 코드 품질 | ESLint, Prettier |

<br>

## 🧩 시스템 아키텍처

클라이언트는 LLM 런타임에 직접 접근하지 않고 애플리케이션 서버를 경유합니다.

- 브라우저에서 LLM 런타임으로의 직접 요청 시 발생하는 교차 출처 제약(CORS) 해소
- LLM 런타임 엔드포인트의 외부 노출 방지
- 시스템 프롬프트 및 모델 설정의 클라이언트 노출 차단
- 요청 빈도 제한 및 타임아웃 정책의 서버 측 일괄 적용

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
      <td align="center"><a href="https://github.com/llmeajinll">@junhwan0697</a></td>
    </tr>

  </tbody>
</table>

<br>

## 💻 포팅 매뉴얼

### 요구 사항

- Node.js 20 이상
- [Ollama](https://ollama.com)
- Supabase 프로젝트

### 설치

```bash
# 저장소 클론
git clone https://github.com/Moonorang/moonorang.git
cd moonorang

# 의존성 설치
npm install
```

### 로컬 LLM 준비

```bash
# 모델 다운로드
ollama pull llama3.2

# Ollama 실행
ollama serve
```

### 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Kakao
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

### 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

<br>

## 📁 프로젝트 구조

```
moonorang/
├── src/
│   ├── app/
│   │   ├── api/           # API Route (LLM 프록시, 요금제, 가입 신청)
│   │   ├── chat/          # 채팅 상담
│   │   ├── plans/         # 요금제 목록 및 상세
│   │   ├── join/          # 가입 신청
│   │   ├── recommend/     # 개인화 추천
│   │   └── my/            # 마이페이지
│   ├── components/        # 공용 컴포넌트
│   ├── features/          # 도메인별 로직
│   ├── lib/               # Supabase 클라이언트, Ollama 연동
│   ├── stores/            # Zustand 스토어
│   ├── data/              # 요금제, 용어 사전
│   └── types/
├── docs/                  # 요구사항 명세서, ERD
└── public/
```

<br>

## 🗓️ 개발 일정

| 기간 | 단계 | 주요 작업 |
|---|---|---|
| 08/14 ~ 08/21 | 설계 및 기반 | 요구사항 정의, 화면 설계, 요금제 데이터 선정, DB 스키마 설계, Ollama 환경 구축, 프로젝트 초기 세팅 |
| 08/24 ~ 08/28 | 핵심 기능 구현 | LLM 프록시 연동 및 채팅, 응답 상태 관리, 요금제 조회, 조건 기반 추천, 가입 신청, 1차 통합 |
| 08/31 ~ 09/04 | 확장 기능 및 마무리 | 회원 인증·마이페이지, 개인화 추천, 쉬운 모드·음성, 절약 상담, 멤버십 지도, 성향 검사, 미션·포인트, 통합 테스트 |
