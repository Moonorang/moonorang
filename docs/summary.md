# 프로젝트 구조 개편 기록

기준 커밋: `0e55fed` (Merge pull request #13) 이후 진행한 작업 전체.
결과: 소스 92개 파일 / 4,709줄, 4레이어 구조.

이 문서는 **무엇을 했는지**보다 **왜 그렇게 골랐는지**를 남기는 데 목적이 있다.
같은 논의를 다시 하지 않기 위해, 채택한 안뿐 아니라 **검토하고 버린 안과 그 이유**도 함께 적는다.

---

## 1. 왜 바꿨나

재편 전 구조는 레이어(무엇으로 만들어졌는지) 기준이었다.

```
src/
 ├─ components/{common, chat, cards, auth}/
 ├─ hooks/  lib/  stores/  types/  utils/  data/
 └─ app/
```

이 구조에서 실제로 깨진 지점은 네 가지였다.

| 문제 | 증거 |
| --- | --- |
| 도메인이 섞임 | `components/chat/`에 성향검사 파일(`QuestionCard`, `TestLoadingModal`)이 들어와 있었음 |
| 서버 전용 코드가 격리되지 않음 | `lib/chatSystemPrompt.ts`가 클라이언트 코드와 같은 폴더 — 실수 한 번이면 시스템 프롬프트가 번들에 실림 (**LLM-006, NFR-008**) |
| `utils/`의 성격 혼재 | `cn`(UI) · `planFormat`(도메인) · `parseSSE`(전송) · `signupSchema`(검증)이 "순수 함수"라는 이유만으로 한 폴더 |
| 배럴 하나로 전부 재수출 | `components/index.ts` 하나가 모든 도메인을 노출 |

기능 브랜치는 이미 `feat/jjh/chat`, `feat/lgt/auth`처럼 **도메인 단위**로 잘려 있었는데 폴더만 그걸 안 따라가고 있었다. 그 불일치가 위 문제들의 공통 원인이었다.

---

## 2. 최종 구조

```
src/
├─ app/                    Next 라우팅 + 앱 셸
│   ├─ layout.tsx  not-found.tsx  favicon.ico
│   ├─ _header/            헤더 슬라이스 (ui / model / config)
│   ├─ (chat)/page.tsx
│   ├─ auth/{login,signup}/page.tsx   auth/callback/route.ts
│   ├─ test/(result)/page.tsx
│   ├─ catalog/            (예정)
│   └─ api/{chat,plans}/route.ts
│
├─ entities/               여러 feature가 공유하는 도메인 개념
│   └─ plan/  index.ts  types.ts  ui/  lib/  server/
│
├─ features/               사용자가 하는 일
│   ├─ chat/   components/ hooks/ lib/ server/ types.ts
│   ├─ auth/   components/ hooks/ lib/ server/ types.ts
│   ├─ test/   components/ hooks/ lib/ data/ store/ types.ts
│   └─ usage/  components/
│
├─ shared/                 도메인 지식 0
│   ├─ ui/     Button Tag CarouselIndicator Drawer QuestionCard
│   │          FormField TextField SelectField fieldSize.ts
│   ├─ lib/    supabase/{client,server}  openai
│   ├─ utils/  cn formatCurrency formatTime applyMask
│   ├─ fonts/  index.ts + .woff
│   └─ styles/ globals.css
│
└─ proxy.ts
```

### 레이어 판정 기준

| 레이어 | 한 줄 질문 |
| --- | --- |
| `shared/` | 이 서비스가 요금제 앱이 아니어도 그대로 쓸 것인가 |
| `entities/` | 두 개 이상의 feature가 이 개념을 참조하는가 |
| `features/` | 사용자 입장에서 하나의 행위로 말할 수 있는가 |
| `app/` | URL과 연결돼 있거나, 여러 feature를 엮는 조립인가 |

### import 규칙

```
app       →  features, entities, shared    전부 참조 가능
features  →  entities, shared              (feature끼리 ❌)
entities  →  shared                        (feature ❌)
shared    →  shared                        (위를 못 봄)
```

`feature → feature`가 금지인 것이 핵심이다. 공유가 필요해지면 `entities`로 올린다.
**현재 이 규칙을 어기는 import는 0건이다.**

### 승격 기준 (entities로 올리는 시점)

> 처음엔 무조건 `features/`에 만든다.
**두 번째 feature가 그것을 import하려는 순간** `entities/`로 승격한다.
> 

취향이 아니라 **개수**로 판정하기 때문에 "이건 entity냐 feature냐" 논쟁이 생기지 않는다.
FSD의 entity/feature 구분이 소규모 팀에서 소모적인 이유가 그 판정이 개념적이기 때문인데, 이 기준은 기계적이다.

이 기준을 지금 적용하면 **`entities`에는 `plan` 하나만** 올라간다.

- `Plan` 타입 소비자: chat(추천 카드) · auth(가입 시 요금제 선택) · test(결과 추천) · usage → **4개 도메인**
- `user`는 아직 auth 한 곳만 쓰므로 대기. 마이페이지(PERSONAL-003~005)나 상담 문맥(CHAT-010)이 들어오면 그때 승격.
- `add-on`, `subscription`, `membership`도 같은 방식으로 대기.

---

## 3. 슬라이스 내부 세그먼트

슬라이스 안은 성격별로 나눈다. **빈 세그먼트는 만들지 않는다** — 5종 세트를 채우는 게 아니라 내용이 생겼을 때만 만든다.

| 세그먼트 | 질문 | 예 |
| --- | --- | --- |
| `ui/` `components/` | JSX를 반환하나 | `SignupForm`, `PlanCard` |
| `model/` `hooks/` `store/` | 상태이거나, 상태를 만드는 규칙인가 | `useChat`, `useHeaderState`, `testStore` |
| `lib/` | 상태도 JSX도 없는 슬라이스 전용 순수 함수인가 | `resolveNextPath`, `sse`, `diagnose` |
| `config/` `data/` | 코드 수정 없이 바뀔 수 있는 값인가 | `menuLinks`, `questions` |
| `server/` | 서버에서만 도는가 (env · SDK · DB) | `systemPrompt`, `planRepository` |

### 세그먼트 안의 import 방향

```
ui → model → lib · config
```

`model`이 `ui`를 참조하면 안 된다. `useHeaderState`가 `variant: 'logo' | 'back'`이 아니라 `isFlowRoute`를 돌려주는 이유가 이것이다 — `HeaderVariant` 타입은 `ui/Header.tsx` 것이라, 훅이 그걸 반환하면 model이 ui에 의존하게 된다.

> **의미는 model이, 표현은 ui가 정한다.**
> 

### 배럴 (Public API)

- 슬라이스마다 `index.ts` 하나. 밖에서는 그것만 본다.
- **클라이언트 배럴과 서버 배럴을 분리한다.** `features/chat/index.ts`와 `features/chat/server/index.ts`.
하나로 합치면 `import { useChat } from '@/features/chat'` 한 줄이 `systemPrompt.ts`를 모듈 그래프에 끌고 들어온다. 번들러가 보통 털어내지만, **"보통은"에 NFR-008을 걸 수 없다.**
- `entities/plan`도 같은 이유로 `index.ts`(PlanCard·타입·포맷)와 `server/index.ts`(planRepository)를 나눴다.

---

## 4. 컴포넌트 API 규칙

> **모양은 props로만. 부모 안에서의 배치는 감싸는 요소가 맡는다.**
> 

`className`을 열어두면 무슨 일이 벌어지는지 실측했다. `<Button>` 호출 15곳을 전수 조사한 결과:

| 넘기던 클래스 | 곳 |
| --- | --- |
| 패딩 재정의 (`px-2 py-1`, `p-0` …) | 12 |
| 글자 크기·굵기 | 9 |
| 내부 정렬 (`flex items-center gap-2`) | 7 |
| **`rounded-sm`** — `radius="sm"` prop이 있는데도 | **4** |
| 색 재정의 | 3 |
| 부모 안 배치 (`flex-1`, `self-start`) | 4 |

**prop이 멀쩡히 있는데 4곳이 className으로 우회하고 있었다.** escape hatch가 있으면 사람은 그쪽을 쓴다.

동시에 15곳 중 12곳이 패딩을 덮어썼다는 것은 **기본값이 실제 쓰임과 안 맞는다**는 뜻이고, 이건 className을 막는다고 해결되지 않는다. 그래서 순서를 이렇게 정했다.

1. **빠져나갈 이유를 먼저 없앤다** — 부족한 props(`size`, `isFullWidth` 등)를 추가
2. 남는 `className`은 순수 배치용뿐 → 그건 감싸는 요소로 옮긴다

### 크기는 숫자가 아니라 토큰으로

폼에서 "크기"는 한 값이 아니라 **같이 움직여야 하는 값 묶음**이다.

```
입력 칸 세로 여백 ─┐
글자 크기         ─┤  생년월일 입력과 성별 토글의 높이가 어긋나면 안 됨
성별 토글 높이     ─┤  셀렉트 화살표 크기·오른쪽 여백도 따라와야 함
셀렉트 화살표      ─┘
```

`height`/`fontSize`를 개별 prop으로 받으면 이 넷이 따로 놀고, 세 명이 각자 값을 넣어 미묘하게 다른 높이가 생긴다. 그래서 `shared/ui/fieldSize.ts`에 표를 두고 **토큰 하나(`size: 'sm' | 'md'`)만 받는다.**

```tsx
FIELD_SIZE_STYLES    = { sm: 'px-3 py-2 text-12', md: 'px-4 py-3 text-14' }
FIELD_HEIGHT_STYLES  = { sm: 'py-2 text-12',      md: 'py-3 text-14' }   // 옆에 서는 요소용
FIELD_SELECT_PADDING = { sm: 'pr-8',              md: 'pr-10' }
FIELD_ICON_SIZE      = { sm: 16,                  md: 20 }
```

새 크기가 필요하면 여기 한 줄 추가하면 네 요소가 전부 따라온다.

### 레이어별 강도

| 레이어 | className 정책 |
| --- | --- |
| `shared/ui/` | 엄격. 디자인 시스템이라 뚫리면 일관성이 무너짐 |
| `entities/*/ui/` | 엄격. `PlanCard`는 네 화면에서 쓰임 |
| `features/*/components/` | 느슨해도 됨. 소비자가 1~2곳이라 오염 범위가 좁음 |

**신규 컴포넌트부터 적용**하고 기존 15곳은 `Button` 정리 때 함께 치운다.

---

## 5. app 레이어의 특수성

`app/`은 다른 레이어와 두 가지가 다르다.

1. **폴더 이름이 곧 URL이다.** 도메인이 아니라 주소가 이름을 결정한다.
2. **파일 이름에 프레임워크 의미가 있다.** `page.tsx` · `route.ts` · `layout.tsx`는 Next가 해석한다.

그래서 app에만 붙는 규칙이 하나 더 있다.

> `app/` 아래에서 라우팅 파일이 아닌 것은 **`_` 접두사 폴더**(Next private folder)에 넣는다.
거기 들어갈 자격은 "이 라우트(들) 전용 조립"뿐 — 다른 화면에서도 쓸 것은 `features`/`entities`로 내린다.
> 

### 페이지에서 코드를 뺄 때 목적지

```
① 다른 화면에서도 쓸 것        → features/ 또는 entities/
② 이 라우트 전용 조립           → app/<route>/_ui, _model
③ 라우팅 자체의 동작            → 페이지에 남긴다
   (redirect 가드, searchParams 파싱, 화면 레이아웃)
```

auth 페이지들은 거의 전부 ①이었다. 반대로 `(chat)/page.tsx`는 여러 feature의 오버레이를 엮는 조립 상태를 갖게 되므로 ②가 맞다 — **라우트마다 답이 다른 게 정상이다.**

---

## 6. 검토하고 채택하지 않은 것

### FSD 6레이어 전면 도입 — ❌

Feature-Sliced Design의 `app / pages / widgets / features / entities / shared`를 그대로 쓰는 안. **실제로 구현해봤다가 되돌렸다.**

가져온 것과 버린 것을 나눠보면 FSD는 두 묶음을 판다.

1. **규칙** — 레이어 단방향 import, Public API, 같은 레이어끼리 참조 금지 → **채택**
2. **분류 체계** — 6층 + 5세그먼트 → **미채택**

2번이 이 프로젝트에 청구한 비용:

- **`entities`/`features` 구분이 요구사항과 충돌.** CARD-019(추천 카드에 가입 버튼)에서 entity가 feature를 참조하지 못해 슬롯 주입이 필요해진다. *(다만 `PlanCard`는 이미 `onJoin` 콜백 방식이라 이 비용은 실제로 발생하지 않았다.)*
- **Next.js와 이름 충돌.** FSD의 `app`/`pages` 레이어가 Next 폴더와 부딪혀 `_app`/`_pages` 개명이 필요하다. 우리는 이미 `_header`·`_fonts`에서 `_`를 "Next 라우팅 제외"라는 **다른 의미**로 쓰고 있어서, 한 코드베이스에서 같은 접두사가 두 뜻을 갖게 된다.
- **FSD는 서버/클라이언트 경계를 모델링하지 않는다.** SPA 전제로 설계돼서 `ui/model/api/lib/config` 어디에도 "서버에서만 도는 코드"를 넣을 칸이 없다. 우리에게 가장 중요한 경계(NFR-008)를 표현 못 하는 분류 체계다. 공식 가이드는 `index.server.ts` **네이밍 컨벤션**을 권하는데, `server/` 폴더 + `server-only` 패키지가 컴파일 단계에서 막아주므로 우리 쪽이 강하다.

### FSD 공식 Next.js 가이드 (`_pages` 재수출) — ❌ (구현 후 롤백)

`app/`을 프로젝트 루트로 빼고 라우트 파일은 재수출만, 실제 화면은 `src/_pages/<slice>/ui/`에 두는 방식.
**실제로 전부 옮겨서 빌드까지 통과시킨 뒤 되돌렸다.** 되돌린 이유:

- 루트 `app/` 9개 파일 합쳐 **9줄**. URL에서 코드로 갈 때 항상 한 번 더 점프
- `_pages` 슬라이스 5개 중 4개가 `index.ts` + 컴포넌트 하나 — 껍데기가 내용보다 큼
- **`LayoutProps<'/'>` 같은 Next 생성 타입을 잃는다.** 라우트 파일 밖으로 나가면 사라져서 `params`/`searchParams`를 손으로 선언해야 한다
- `app`이라는 이름의 폴더가 두 개(`/app`, `/src/_app`)
- **가장 중요한 것: 실제 문제를 하나도 안 고쳤다.** `(chat)/page.tsx`는 197줄 그대로였고, 채팅·성향검사 두 도메인이 섞인 상태도 그대로였다

> 참고: Next 문서상 루트에 `app/`이 있으면 `src/app`은 **무시된다**. 그래서 `_app`/`_pages` 개명은 기술적으로는 불필요하다. 다만 "같은 이름의 폴더 중 하나를 프레임워크가 조용히 무시하는" 상태가 되어, 새 사람이 `src/app/`에 라우트를 추가하면 아무 일도 안 일어난다.
> 

**가이드에서 가져온 것 하나**: "라우트 파일에는 로직이 없다"는 규율. 다만 파일을 둘로 쪼개는 대신 **규칙(50줄 넘으면 feature로)**으로 같은 결과를 얻는다. 재수출로는 도메인이 갈리지 않지만 feature 추출로는 갈린다.

### `widgets` 레이어 — ❌

정당한 후보는 헤더 하나였다. `AppHeader`가 `useAuth`를 참조하므로 shared에도 features에도 못 둔다. 하지만 **`app/layout.tsx`가 유일한 소비자**라 앱 셸이고, `app/_header/`로 충분하다. 레이어를 하나 더 만들 이유가 없다.

### `_pages`(views) 레이어 — ❌

Next의 `app/`이 그 자리다. 별도 레이어를 만들면 라우팅 파일과 화면 조립 파일이 상시 2개씩 생긴다.

### 세그먼트 이름 일괄 통일 (`components→ui`, `hooks→model`) — 보류

`app/_header`만 `ui/model/config`이고 features는 `components/hooks/lib`이라 어휘가 두 벌이다. 통일하려면 전 슬라이스를 함께 바꿔야 의미가 있고, 파일이 83개인 지금이 가장 싼 시점이다. **아직 안 했다.**

---

## 7. 진행한 작업

### 7.1 레이어 재편

- `components/{common,chat,cards,auth}` → `shared/ui`, `entities/plan/ui`, `features/*/components`, `app/_header/ui`로 분산
- `hooks/`, `stores/`, `data/`, `types/`, `lib/`, `utils/` 해체 → 각 슬라이스로
- 전역 배럴 `components/index.ts` 삭제 → 슬라이스별 `index.ts`
- 모든 `@/` import 경로 재작성 후, 63개 파일의 전 import가 해석되는지 스크립트로 검증

### 7.2 폰트 · 전역 CSS를 `shared/`로

디자인 시스템이 두 레이어에 쪼개져 있었다 — 토큰(`globals.css`)과 폰트는 `app/`, 프리미티브(`Button`)는 `shared/`.

**폰트만 옮기면 오히려 나빠진다.** 폰트 로더가 만드는 CSS 변수(`--font-display-local`)를 `globals.css`의 `@theme`이 소비하는 구조라, 둘을 갈라놓으면 지금보다 흩어진다. 그래서 함께 옮겼다.

```
shared/fonts/{index.ts, *.woff}
shared/styles/globals.css
```

`next/font/local`의 `src`는 로더 파일 기준 상대 경로라 `.woff`를 같이 옮겨 수정이 없었고, Tailwind v4는 소스 자동 탐지라 설정 변경도 없었다. 빌드 산출물에서 `--font-sans`, `.font-display`, `@font-face` 2개를 직접 확인했다.

> 폰트를 `public/`에 두지 않는 이유: `next/font/local`이 빌드 시 해시 붙은 static asset으로 복사하며 자체 호스팅·preload·fallback 메트릭까지 처리한다. `public/`에 두면 같은 파일이 두 경로로 서빙되고 캐시 무효화가 수동이 된다.
> 

### 7.3 `app/_header` 슬라이스 + 세그먼트

`_components/`라는 이름은 "무엇인지"가 아니라 "무엇으로 만들어졌는지"였다. 헤더 3종을 슬라이스로 묶고 세그먼트를 적용했다.

```
app/_header/
├─ index.ts                  AppHeader 하나만 export
├─ config/menuLinks.ts       MENU_LINKS   → ui/SideMenu
├─ config/flowRoutes.ts      FLOW_ROUTES  → model/useHeaderState
├─ model/useHeaderState.ts   useAuth + pathname + 메뉴 열림 상태
└─ ui/  AppHeader  Header  SideMenu
```

**소유권 이전으로 prop drilling 제거.** 이전엔 `Header`가 `isMenuOpen`을 소유하고 `SideMenu`를 자식으로 렌더해서, `isLoggedIn`·`onLoginClick`·`onLogoutClick` 세 개가 Header를 **통과만** 하고 있었다. Header는 이 값들을 하나도 쓰지 않았다.

```
before  <Header variant hasMenu onBackClick isLoggedIn onLoginClick onLogoutClick />
           └─ <SideMenu isOpen={isMenuOpen} … />

after   <Header variant hasMenu onBackClick onMenuClick />     ← props 7 → 5
        <SideMenu isOpen onClose isLoggedIn onLoginClick onLogoutClick />
```

**Header를 순수 컴포넌트로.** `useRouter`를 걷어내 115줄 → 69줄, `'use client'`도 제거. 작업 중 확인해보니 `router.back()` fallback은 **도달 불가능한 코드**였다 — 뒤로가기 버튼은 `variant='back'`일 때만 렌더되고 그건 flow route에서만인데, 그 경우 AppHeader가 항상 `goHome`을 넘긴다. 그래서 `goBack`을 추가하지 않고 삼항을 없앴다(동작 변화 0).

**config 파일 분할.** 처음엔 `navigation.ts` 한 파일이었는데 이름이 안 정해졌다. 원인은 **두 상수가 같이 있을 이유가 없어서**였다 — `MENU_LINKS`는 `SideMenu`만, `FLOW_ROUTES`는 `useHeaderState`만 쓴다. 우산 이름을 찾는 대신 파일을 갈랐고, 파일 이름이 곧 export 이름이 되어 이름 문제가 사라졌다.

`MenuLink` 타입은 `menuLinks.ts` 안에 `export` 없이 뒀다. **한 파일에서만 쓰는 타입은 그 파일에 둔다** — 두 번째 세그먼트가 필요로 할 때 슬라이스 `types.ts`로 올린다.

### 7.4 `shared/ui/Drawer` 추출

`SideMenu` 안에 성격이 다른 세 덩어리가 있었다.

| 덩어리 | 줄 | 성격 |
| --- | --- | --- |
| body 스크롤 차단 + Escape 닫기 | 16 | 재사용 (**COMMON-005**) |
| 딤 배경 + 슬라이드 패널 + 컨테이너 폭 정렬 | 35 | 재사용 |
| 로그인/로그아웃 + `MENU_LINKS` | 20 | 이 앱 전용 |

"채팅을 벗어나지 않는다"는 설계 원칙 때문에 앞으로 로그인 모달(AUTH-001) · 가입 카드(CARD-029) · 요금제 상세 · 조건 수집 카드가 전부 앞의 두 덩어리를 필요로 한다. **SideMenu 125줄 → 57줄.**

`ariaLabel="메뉴"`를 넘기면 닫기 버튼 라벨이 `"메뉴 닫기"`가 되어 기존 접근성 라벨이 유지된다.

> 지금은 우측 슬라이드로 고정돼 있다. 바텀시트·가운데 모달이 필요해지면 `placement` prop으로 넓히거나 공통부만 `Overlay`로 한 번 더 빼면 된다. **실제 요구가 나오기 전에 추상화하지 않았다.**
> 

### 7.5 auth 정리

**코드 추출** — 페이지에 있던 것을 목적지별로 내렸다.

| 원래 위치 | 목적지 | 근거 |
| --- | --- | --- |
| `login/page.tsx`의 상태·핸들러·버튼 | `features/auth/components/KakaoLoginButton` | AUTH-001 로그인 모달에서도 쓸 것 |
| `getKakaoNickname` | `features/auth/lib/` | 카카오 메타데이터 해석 = auth 도메인 지식 |
| `resolveNextPath` | `features/auth/lib/` | callback도 필요한데 거기엔 없었음 |
| `users` 존재 확인 | `features/auth/server/currentUser.ts` | callback과 중복 쿼리였음 |
| `plans` 직접 쿼리 | `entities/plan/server/getPlanOptions()` | app 레이어가 Supabase를 직접 호출하고 있었음 |
| redirect 가드 · searchParams 파싱 | 페이지에 유지 | 라우팅 동작 |

결과: `login/page.tsx` 52 → **11줄**(서버 컴포넌트로 전환), `signup/page.tsx` 84 → **55줄**.

부수적으로, `SignupForm`이 `@/app/auth/signup/actions`를 import하던 **컴포넌트 → app 역참조**가 해소됐다.

**버그 4건 수정**

1. **`submitSignup`이 실패를 성공으로 보고** — `users` upsert가 실패해도 `console.error`만 찍고 `{}`를 반환했다. 폼이 그대로 다음 화면으로 넘어가고, `users` 행이 없어서 다음 로그인 때 다시 가입 화면으로 튕기는 루프가 됐다(**AUTH-009 위반**). `errorMessage` 반환으로 수정.
2. **AUTH-014 `next` 파이프 단절** — `callback`이 `searchParams.get('next')`를 읽는데 **넣어주는 쪽이 없었다.** `goLogin` → 로그인 페이지 → `signInWithKakao` → `callback` 네 지점을 연결. 모든 경계에서 `resolveNextPath`를 거친다.
3. **로그인 실패 사유 미표시** — callback이 `?error=missing_code`를 붙여 보내는데 읽는 코드가 없었다. `getLoginErrorMessage`로 사유→문구 매핑(**NFR-011**: 원인 + 조치 방법)을 만들고, `KakaoLoginButton`이 URL 사유와 호출 실패를 한 자리에서 표시.
4. **입력 마스킹 커서 튐** — `event.target.value`를 덮어쓰기만 해서 가운데를 고치면 커서가 맨 뒤로 갔다. **커서 앞의 숫자 개수**를 기준점으로 삼아 포맷 후 같은 자리로 되돌리는 `applyMask`를 만들었다.

### 7.6 성향검사 결과 화면 분리

`app/test/(result)/page.tsx` **229줄 → 11줄.**

```
features/test/
├─ hooks/useTestResult.ts     77   상태·조회·핸들러 (리다이렉트 가드 포함)
└─ components/
    ├─ TestResult.tsx        103   결과 화면 본문
    ├─ BenefitList.tsx        59   BENEFIT_STYLES + 혜택 목록
    └─ SectionTitle.tsx       36   섹션 머리말
```

페이지는 **화면 레이아웃**만 갖고 내용은 feature가 갖는다. 리다이렉트 가드는 store 상태(`answers`)에 물려 있어서 훅에 뒀다 — 페이지로 올리면 페이지가 다시 클라이언트 컴포넌트가 된다.

같이 처리한 것:

- **중복 헤더 제거.** `layout.tsx`가 모든 라우트에 `AppHeader`를 그리는데 이 페이지가 `<Header />`를 하나 더 그렸다. 둘 다 `fixed top-0`이라 겹쳤고, **위에 깔린 쪽이 `onMenuClick` 없이 햄버거를 렌더해서 `/test`에서 메뉴가 안 열리고 있었다.** 지우면서 그 버그도 사라졌다.
- **이름 충돌 정리.** 컴포넌트 `TestResult`와 타입 `TestResult`가 배럴에서 부딪혀 타입을 `Diagnosis`로 개명. `diagnosePlanType`이 반환하는 값이니 이름도 이쪽이 정확하다.
- `SectionTitle`의 아이콘 배경색을 `className` → `iconTone` prop으로 (신규 컴포넌트에 props-only 원칙 적용)

### 7.7 `QuestionCard`를 `shared/ui`로

`_tmp`에 보류돼 있던 유일한 규칙 위반이었다. `question: TestQuestion`으로 `features/test` 타입에 묶여 있어서, shared에 두면 shared→features, features/chat에 두면 feature끼리 참조가 됐다.

props를 도메인 무관 형태로 일반화해서 해소:

```
question: TestQuestion   →  question: string + options: QuestionOption[]
selectedScore            →  selectedValue
option.score             →  option.value   (의미는 호출부가 정한다)
```

`TestQuestion`의 `id`·`countsTowardType`은 카드가 원래 안 쓰던 값이라 자연히 빠졌다.

**`children` 슬롯을 추가했다.** 성향검사와 조건 수집이 같은 디자인을 쓰지만 **조건 수집에만 기타(직접 입력)가 있다**(CARD-011). 기타 입력의 실제 모양(값 타입, 검증, 즉시 반영 여부, CARD-013과의 연결)은 아직 모르므로, `hasFreeInput` 플래그로 개념을 박아넣는 대신 자리만 비워뒀다. **있다는 사실은 확정이고 어떤 모양인지만 미정**이라, 슬롯 한 줄이 그 결정을 미뤄준다.

`className`도 제거했다 — 호출부가 아무도 안 넘기고 있어서 새 원칙을 적용할 첫 대상이 됐다.

### 7.8 폼 프리미티브

`SignupForm` 234줄 → 171줄, `GROUP_CLASS`/`LABEL_CLASS`/`FIELD_CLASS`/`ERROR_CLASS` 문자열 상수 전부 제거.

```
shared/ui/  fieldSize.ts  FormField.tsx  TextField.tsx  SelectField.tsx
shared/utils/applyMask.ts          (features/auth 에서 승격)
features/auth/components/GenderToggle.tsx
```

설계에서 정한 것:

- **`size` 이름을 쓰려고 네이티브 `size`를 지웠다.** `<input size>`는 "글자 수 기준 폭"이라 Tailwind와 함께 쓸 일이 없다. `Omit<ComponentPropsWithRef<'input'>, 'size' | 'className'>`
- **`ComponentPropsWithRef`** 라서 React 19 기준 `ref`가 통과하고 `{...register('contact')}`가 그대로 동작한다
- **`className`을 아예 안 받는다.** 생년월일 칸의 `flex-1`은 감싸는 `<div>`가 맡는다 — TextField는 `w-full`이라 폭을 모른다
- **마스킹이 prop이 됐다.** `format={formatContact}` 한 줄. 이 때문에 `applyMask`가 `shared/utils`로 승격됐다(주석에 적어둔 승격 조건이 충족). 포맷 함수 자체는 auth 도메인이라 남았다
- **`GenderToggle`은 `features/auth`에** — `Gender` 타입과 '남/여' 라벨을 알기 때문에 shared 자격이 없다. 높이만 `FIELD_HEIGHT_STYLES`를 참조해 옆 입력 칸과 맞춘다
- `isInvalid` → `aria-invalid`. 화면은 그대로고 보조기술만 오류 상태를 안다(AUTH-007)

### 7.9 채팅 API route 분해

`app/api/chat/route.ts` **273줄 → 21줄.**

한 파일에 성격이 다른 네 가지가 섞여 있었다 — HTTP 처리 · SSE 포맷 · OpenAI 스트리밍 · 툴콜 후처리.

```
features/chat/
├─ lib/
│   ├─ sse.ts          52   와이어 포맷 (인코더 + 디코더 + 헤더)
│   └─ schema.ts       19   요청 바디 검증
└─ server/
    ├─ chatStream.ts   95   1턴/2턴 오케스트레이션 · 에러 매핑 · cancel
    ├─ openaiStream.ts 78   OpenAI 스트리밍 1회 + tool_calls 누적
    └─ recommendPlans.ts 76 툴콜 → DB 조회 → recommendation 이벤트
```

```tsx
// app/api/chat/route.ts — HTTP 만 남는다
export async function POST(request: Request) {
  const parsed = parseChatRequest(await request.json());

  if (!parsed.ok) {
    return new Response(
      formatSSEEvent({ event: 'error', data: { reason: 'invalid_format', message: parsed.message } }),
      { status: 400, headers: SSE_HEADERS },
    );
  }

  return new Response(createChatStream(parsed.data.message), { headers: SSE_HEADERS });
}
```

설계에서 정한 것:

**인코더와 디코더를 한 파일에 뒀다.** 원래 `formatSSE`는 route.ts 안에, `parseSSEEvent`는 `utils/parseSSE.ts`에 있어서 **같은 와이어 포맷의 양면이 300줄 떨어져** 있었다. `event: …\ndata: …\n\n` 규칙을 한쪽만 고치면 조용히 깨지고, 증상은 "토큰이 안 온다"로만 나타난다. 한 파일에 두면 그럴 수 없다.

**`createSSESender(controller)`로 인코딩을 감췄다.** 이전엔 이벤트를 보낼 때마다 `controller.enqueue(encoder.encode(formatSSE(...)))`를 반복했다. 이제 서버 모듈들은 `send({ event, data })`만 부르고 `TextEncoder`를 모른다. 덕분에 `streamCompletion`·`handleRecommendPlansCall`의 시그니처에서 `controller`·`encoder` 두 인자가 사라졌다.

**`finishReason`을 제거했다.** `streamCompletion`이 반환했지만 아무도 읽지 않는 값이었다.

### 7.10 채팅 페이지 분해

`app/(chat)/page.tsx` **199줄 → 37줄.** 채팅 흐름과 성향검사 흐름 두 도메인이 한 파일에 있었다.

```
features/chat/
├─ components/ChatRoom.tsx  156   대화 내역 · 추천 칩 · 입력창 · 추가 기능 메뉴
└─ constants.ts              12   WELCOME_MESSAGE (CHAT-002)

features/test/
├─ hooks/useTestFlow.ts      71   문항 이동 · 응답 · 결과 화면 전환
└─ components/TestQuestionCard.tsx 49  공용 QuestionCard 에 TEST_QUESTIONS 매핑
```

**두 feature를 슬롯으로 이었다.** 검사 문항 카드는 대화 영역 **안쪽 하단**에 떠야 하는데, `features/chat`이 `features/test`를 참조할 수는 없다. `ChatRoom`이 `overlay?: ReactNode` 슬롯을 열고, app이 거기에 검사 카드를 꽂는다.

```tsx
// app/(chat)/page.tsx — 두 feature 를 엮는 지점
const test = useTestFlow();

<ChatRoom
  onPlanTest={test.openTest}
  overlay={test.isTestOpen ? <TestQuestionCard … /> : undefined}
/>
{test.isResultLoading && <TestLoadingModal />}
```

`overlay` 유무가 곧 열림 여부라 `isOverlayOpen` 같은 중복 prop을 두지 않았다. 추천 질문 칩을 감추는 조건도 `!isTestOpen`이 아니라 `!overlay`로 바뀌어, **ChatRoom이 성향검사의 존재를 모른다.**

**`_model/`은 만들지 않았다.** 계획에서는 오버레이 조립 상태를 `app/(chat)/_model/`에 두려 했는데, 막상 갈라 보니 **app에 남는 상태가 하나도 없었다.** `isTestOpen`은 `testStore`가, 메시지·입력값은 `ChatRoom`이, 결과 전환은 `useTestFlow`가 각각 소유한다. §3의 "빈 세그먼트는 만들지 않는다"에 따라 생략했다.

`_model/`이 필요해지는 시점은 **오버레이가 여럿이 되어 서로 경쟁할 때**다 — 로그인 모달(AUTH-001) · 가입 플로우(CARD-029) · 요금제 상세가 붙으면 "지금 무엇이 열려 있나"를 정하는 상태가 생기고, 그건 어느 feature 것도 아니다.

**분해하면서 잡은 레이어 위반 1건.** §7.6에서 `useTestResult`를 뽑을 때, 원래 페이지(app 레이어)에 있던 `useAuth` 호출이 feature 안으로 따라 들어가 **`features/test` → `features/auth`** 참조가 됐다. 그때 재검사를 안 해서 놓쳤고, 이번에 전수 검사로 잡았다.

고친 방식: `displayName`을 `TestResult`의 prop으로 빼고, **app 레이어인 페이지가 서버에서 읽어 넘긴다.**

```tsx
// app/test/(result)/page.tsx — 서버 컴포넌트
const user = await getCurrentUser();
<TestResult displayName={getDisplayName(user)} />
```

이름 추출 로직은 `features/auth/lib/getDisplayName.ts`로 옮겼다. 부수 효과로 클라이언트 `getUser()` 왕복이 하나 줄었다.

### 7.11 기타

- `(auth)` route group → `auth` 실제 세그먼트. 괄호 때문에 실제 URL이 `/login`이었는데 코드 6곳은 `/auth/login`을 가리켜 **카카오 로그인이 동작하지 않고 있었다.** route group에 `layout.tsx`도 없어서 얻는 것 없이 버그만 만든 상태였다. 괄호를 떼서 코드 수정 없이 해소.
- `features/tendency-test` → `features/test` (라우트 `/test`와 이름 일치)
- `src/_tmp/` 삭제 — 보류 파일 3건 정리 완료

### 7.12 라우트 파일 최종 크기

§5의 "라우트 파일은 조립만" 규칙이 실제로 지켜지는지의 결과다.

| 파일 | 전 | 후 |
| --- | --- | --- |
| `api/chat/route.ts` | 273 | **21** |
| `(chat)/page.tsx` | 199 | **37** |
| `test/(result)/page.tsx` | 229 | **17** |
| `auth/signup/page.tsx` | 84 | **58** |
| `auth/login/page.tsx` | 52 | **22** |

전부 50줄 안팎이고, `(chat)/page.tsx`만 37줄인데 그중 대부분이 `TestQuestionCard`에 넘기는 props다.

---

## 8. 검증 방법

매 단계마다 아래 셋을 통과시켰다.

```bash
npx next build          # 타입 검사 + 8개 라우트 생성 확인
npx eslint src
```

추가로 구조 특유의 검증을 스크립트로 돌렸다.

- **import 해석 검사** — 모든 `@/` · 상대 경로가 실제 파일로 해석되는지 (대규모 이동 직후)
- **레이어 위반 검사** — `shared`/`entities`가 상위를 참조하는지, feature끼리 참조하는지
- **빌드 산출물 검사** — 폰트 이동 후 `.next/static/chunks/*.css`에서 `-font-sans`·`@font-face` 확인

현재 위반 **0건**.

---

## 9. 남은 일

### 구조

- [ ]  `npm i server-only` 후 `features/*/server/`, `entities/plan/server/`, `shared/lib/{openai,supabase/server}`에 `import 'server-only'` — 컨벤션이 아니라 컴파일러가 NFR-008을 지키게
- [ ]  `eslint-plugin-boundaries`로 import 규칙 강제 (§2의 매트릭스를 설정으로)
- [ ]  크로스 슬라이스 import를 배럴 경유로 전환 — `index.ts` 9개를 만들어뒀지만 아직 아무도 안 쓴다(전부 deep import)
- [ ]  세그먼트 이름 통일 (`components→ui`, `hooks/store→model`, `data→config`) — 할 거면 지금이 가장 쌈

### 코드

- [ ]  `app/not-found.tsx` **196줄** — OpenAI 연결 확인용 임시 상태가 들어 있다(`testInput`·`handleTestSend`). 404 화면과 무관하므로 걷어내야 한다
- [ ]  `features/usage/components/UsageAnalysisCard.tsx` **182줄** — 아직 어느 화면에도 붙어 있지 않다. CARD-022~026 붙일 때 분해
- [ ]  `features/chat/hooks/useChat.ts` **172줄** — fetch + 스트림 읽기 루프를 `lib/chatClient.ts`로 빼면 훅은 상태 관리만 남고, CHAT-008(생성 중단)을 `AbortSignal` 하나로 얹을 수 있다
- [ ]  `Button`에 `size`·`isIconOnly`·`isFullWidth` 추가 후 호출부 15곳 정리 (§4)
- [ ]  `PlanCard`의 `w-[80%]` 하드코딩 → 호출부가 `className="w-full"`로 덮고 있다
- [ ]  `useAuth` 단일화 — 지금 3곳에서 각자 `getUser()` 호출 + 각자 구독. CHAT-010이 붙으면 더 늘어난다
- [ ]  `features/auth/types.ts`의 `UserRow`가 미사용 — 마이페이지에서 쓰기 시작하면 `entities/user`로 승격

### 미구현 요구사항 (auth 기준)

| ID | 상태 |
| --- | --- |
| AUTH-001 · 002 로그인 **모달** | ❌ 현재 페이지. `Drawer`와 `KakaoLoginButton`이 준비돼 있어 붙이기만 하면 됨 |
| AUTH-008 가입 플로우 연계 | ❌ 가입 플로우 자체가 미구현 |
| AUTH-010 입력 이탈 복구 | ❌ (선택) |

---

## 10. 이 문서를 쓰는 이유

구조 논의를 네 번 반복하면서 배운 것이 있다. 매 질문에 성실히 답한 결과가 **레이어 4개 → 6개 → 4개**였고, 그동안 `(chat)/page.tsx` 197줄과 `api/chat/route.ts` 273줄은 한 줄도 안 움직였다. (둘 다 §7.9~7.10에서 뒤늦게 정리했다 — 각각 21줄·37줄.)

빠져 있던 것은 답이 아니라 **"구조 논의를 언제 멈출지"에 대한 합의**였다.

> **구조는 여기서 동결한다. 다음 구조 변경은 기능이 다 들어간 뒤에.**
> 

§9의 "코드" 항목이 실제로 제품을 진전시키는 일이고, "구조" 항목은 거기 가기 위한 정리다.