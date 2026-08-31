# 프로젝트 구조 가이드

## 1. 큰 그림

`src/` 아래에 폴더가 네 개 있으며 그것이 네 개의 **레이어**입니다.

```
src/
├─ app/        Next 라우팅 + 앱 셸
├─ features/   사용자가 하는 일       ← 코드의 무게중심
├─ entities/   여러 feature가 공유하는 도메인 개념
└─ shared/     도메인 지식이 0인 것
```

각 레이어는 한 줄 질문으로 구분합니다.

| 레이어 | 질문 | 지금 들어 있는 것 |
| --- | --- | --- |
| `shared/` | 이 서비스가 요금제 앱이 아니어도 그대로 쓸 것인가 | Button, Drawer, TextField, cn, supabase client, fonts |
| `entities/` | **두 개 이상**의 feature가 이 개념을 참조하는가 | `plan` |
| `features/` | 사용자 입장에서 한 문장으로 말할 수 있는가 | `chat` `auth` `test` `usage` |
| `app/` | URL과 연결돼 있거나, 여러 feature를 엮는 조립인가 | 라우트 파일들, `_header` |

레이어 안은 다시 **슬라이스**(도메인 하나)로, 슬라이스 안은 **세그먼트**(성격별 폴더)로 나눕니다.

```
features / chat / components / ChatRoom.tsx
  레이어    슬라이스   세그먼트      파일
```

`shared/`만 슬라이스가 없는데, 도메인이 없기에 최상위 폴더가 곧 세그먼트입니다.

## 2. 새 파일을 어디에 둘까

위에서부터 답하면 자리를 정할 수 있습니다.

```
① URL과 연결되나? (page.tsx / route.ts / layout.tsx)
   → app/<경로>/

② 요금제·채팅·회원 같은 도메인 단어가 파일에 나오나?
   NO  → shared/
        ├ JSX를 반환하면        → shared/ui/
        ├ 외부 SDK를 감싸면      → shared/lib/
        └ 순수 함수면           → shared/utils/

③ 두 개 이상의 feature가 이걸 쓰나?
   YES → entities/<도메인>/
   NO  → features/<도메인>/
```

**③이 헷갈릴 때는 그냥 `features/`에 만들면 됩니다.**

다른 features에서 import가 필요한 순간 entities에 옮기면 되고,
미리 entities에 올려두지 않습니다.

## 3. 슬라이스 안에서 — 세그먼트

| 세그먼트 | 질문 | 예 |
| --- | --- | --- |
| `components/` (`ui/`) | JSX를 반환하나 |
| `hooks/` `store/` (`model/`) | 상태이거나, 상태를 만드는 규칙인가 |
| `lib/` | 상태도 JSX도 없는 이 슬라이스 전용 순수 함수인가 |
| `data/` (`config/`) | 코드를 안 고치고 바꿀 수 있는 값인가 |
| `server/` | 서버에서만 도나 (env · SDK · DB) |
| `types.ts` | 슬라이스 안 여러 세그먼트가 쓰는 타입 |

**빈 세그먼트는 만들지 않습니다.**

다섯 개를 다 채우는 게 아닌 내용이 생겼을 때만 만듭니다.

> 괄호 안 이름(`ui`/`model`/`config`)은 `entities/plan`과 `app/_header`가 쓰는 표기입니다.
**새 슬라이스를 만들 때는 옆 슬라이스와 같은 이름을 쓰면 됩니다.**
> 

### 세그먼트 사이의 방향

```
ui -> model -> lib, config
```

`model`이 `ui`를 참조하면 안 됩니다.
예를 들어 `useHeaderState`는 `variant: 'logo' | 'back'`이 아니라 `isFlowRoute`를 돌려줍니다.
`HeaderVariant` 타입이 `ui/Header.tsx` 것이라, 훅이 그걸 반환하면 방향이 거꾸로 되기 때문이다.

> **의미는 model이, 표현은 ui가 정합니다.**
> 

## 4. 반드시 지킬 규칙 셋

### ① import는 한 방향으로만

```
app       ->  features, entities, shared   전부 가능
features  ->  entities, shared             (다른 feature ❌)
entities  ->  shared                       (feature ❌)
shared    ->  shared                       (위를 못 봄)
```

`shared`가 `features`를 import하고 있다면 그건 `shared`가 아닙니다.

### ② feature끼리 직접 참조하지 않는다

예를 들어, `features/chat`이 `features/test`를 import하면 안 됩니다.

- **공유할 개념이면** -> `entities/`로 승격
- **엮는 게 목적이면** -> `app/`에서 조립

### ③ 라우트 파일에서는 조립만 한다

`app/**/page.tsx`에서 코드를 분리할 때, 목적지는 셋 중 하나입니다.

```
다른 화면에서도 쓸 것        -> features/ 또는 entities/
이 라우트 전용 조립          -> app/<route>/_ui, _model
라우팅 자체의 동작          -> 페이지에 남긴다
```

## 5. app 레이어만의 규칙

`app/`은 일반적이지 않은 특수한 레이어입니다. **(Next.js)**

1. **폴더 이름이 곧 URL** | 도메인이 아니라 주소가 이름을 정합니다.
2. **파일 이름이 프레임워크를 의미** | `page.tsx` `route.ts` `layout.tsx`는 Next가 해석합니다.

그래서 추가적인 규칙이 붙습니다.

> `app/` 아래에서 라우팅 파일이 아닌 것은 **`_` 접두사 폴더**에 넣습니다.