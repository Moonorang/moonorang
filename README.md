# 🐙 **무너랑** (Moonorang)

> 요금제 가입을 위한 AI 채팅 서비스

**LLM 기반 상담을 통해 사용자에게 맞는 이동통신 요금제를 추천하고, 가입 신청까지 연결하는 웹 서비스입니다.**

<br>

## 🌟 프로젝트 개요

### 📱 플랫폼

모바일 우선 반응형 웹 어플리케이션

### 목적

요금제는 데이터 제공량, 통화량, 약정 조건 등 고려해야 할 요소가 많아 일반 사용자가 자신에게 적합한 상품을 판단하기 어렵습니다.

무너랑은 통신사의 요금제 가입 상담 서비스를 가정하여, 사용자가 채팅을 통해 가입 조건을 입력하고 LLM의 상담 응답을 확인한 뒤 추천 요금제를 선택해 가입까지 진행할 수 있는 서비스를 구현합니다.

<br>

## 🚀 주요 기능
 
### 1. AI 상담
 
| 기능 | 설명 |
|---|---|
| 프론티어 LLM 실시간 채팅 | OpenAI GPT-4o mini를 서버 경유 프록시로 연동하고, 생성된 응답을 토큰 단위로 스트리밍하여 실시간 표시 |
| 응답 상태 관리 및 예외 처리 | 대기, 생성 중, 완료, 실패로 응답 상태를 관리하며 실패 시 실패 사유를 구분하여 예외 처리 |
| 대화형 조건 수집 | 선택형 질문 카드와 자유 입력을 통해 데이터 사용량, 통화량, 예산, 부가서비스 선호 등을 수집하고 구조화하여 저장 |
| 요금제 절약 상담 | 현재 이용 중인 요금제와 사용량을 분석하여 절감 여지를 판단하고, 예상 절감액을 월 또는 연 단위로 산출하여 제시 |
| 음성 입력 및 음성 안내 | 음성으로 질문을 입력하고(STT), 상담 응답을 음성으로 읽어주는(TTS) 기능 제공 |
 
### 2. 요금제
 
| 기능 | 설명 |
|---|---|
| 요금제 데이터 구성 및 조회 | 월 요금, 데이터 제공량, 통화량, 부가 혜택 등을 포함한 요금제를 10개 내외로 구성하고 목록 및 상세 정보 제공 |
| 조건 기반 추천 및 카드 표시 | 수집된 조건에 대한 점수 산정으로 요금제를 선별하여 최대 3개를 카드로 표시하고, 순위와 선정 이유를 함께 제공 |
| AI 생성 가입 플로우 | 결제창을 포함한 가입 플로우 UI를 AI가 직접 생성하여 최종 가입까지 연결하고, 오류 발생 시 사전에 정의된 예외 처리 모달을 표시 |
| 본인 인증 및 약관 동의 | 문자 메시지(SMS)를 서비스사 쪽으로 직접 전송하여 본인 또는 기기 소유를 확인하는 MO 인증 방식을 사용하고, 요금제 상세 확인과 가입 조건 약관 동의 단계를 제공. 카드사, 카드 번호, 유효기간, CVC는 더미 데이터로 처리 |
| 가입 및 변경 분기 처리 | 회원 여부에 따라 회원은 요금제 변경, 비회원은 요금제 가입으로 분기 처리 |
 
### 3. 개인화 추천
 
| 기능 | 설명 |
|---|---|
| 활동 기록 기반 추천 | 요금제, 부가서비스, 구독 등의 가입 및 변경 이력을 이벤트로 기록하고, 이를 추천 산출과 상담 문맥에 반영 |
| 요금 이력 기반 AI 조언 | 최근 3개월의 월별 요금과 사용량 추이를 분석하여 변동 요인을 파악하고, 카드 형식으로 요금제 추천 |
| 요금제 성향 검사 | 객관식 문항 응답을 점수화하여 성향 유형을 판정하고, 이에 따른 추천 요금제와 이용 조건을 제시하며 결과를 공유할 수 있도록 제공 |
| 구독 상품 추천 | 사용자 활동과 성향 검사 결과 등을 기준으로 어울리는 구독형 상품을 카드 형식으로 추천 |
| 연령대 기반 부가서비스 추천 | 사용자와 비슷한 연령대에서 이용 비율이 높은 부가서비스를 분석하여 카드 형식으로 추천 |
 
### 4. 회원 및 혜택
 
| 기능 | 설명 |
|---|---|
| 로그인 및 마이페이지 | 카카오 간편 로그인으로 회원을 등록하고 현재 요금제와 이용 중인 서비스 목록을 조회. 우측 상단 햄버거 버튼 클릭 시 로그인 여부에 따라 마이페이지 또는 로그인 필요 안내를 표시 |
| 포인트 적립 및 사용 | 요금제 정상 납부 시 포인트를 적립하고, 멤버십에서 포인트를 사용해 할인 적용 |
| 위치 기반 멤버십 제휴사 지도 | 현재 위치를 기준으로 인근 멤버십 사용 가능 제휴사를 지도에 표시하고 혜택 정보 제공 |
 
### 5. 사용자 경험
 
| 기능 | 설명 |
|---|---|
| 스켈레톤 UI | 페이지 및 모달창 로딩 시 자연스러운 시각적 표현을 위한 스켈레톤 UI 구현 |
 
<br>

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Zustand |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth + OAuth 2.0 (Kakao) |
| AI / LLM | OpenAI GPT-4o mini (Chat Completions API), STT / TTS |
| External API | KakaoMap API |
| 협업 도구 | Notion, Jira, Figma, GitHub, Slack, ERDCloud |
| 코드 품질 | ESLint, Prettier |

<br>

## 🧩 시스템 아키텍처

클라이언트는 LLM 런타임에 직접 접근하지 않고 애플리케이션 서버를 경유합니다.

- API 키의 클라이언트 노출 차단
- 시스템 프롬프트 및 모델 설정의 클라이언트 노출 차단
- 요청 빈도 제한 및 타임아웃 정책의 서버 측 일괄 적용
- 사용자 데이터 주입과 응답 후처리를 서버 단일 지점에서 처리

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
- OpenAI API 키
- Supabase 프로젝트
- Kakao Developers 애플리케이션 (로그인, 지도)

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

# OpenAI
OPENAI_API_KEY=
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
│   ├── data/              # 요금제, 용어 사전, 더미 데이터
│   └── types/             # 타입 정의
└── public/
```
