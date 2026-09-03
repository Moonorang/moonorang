import OpenAI from 'openai';

// 서버 전용 openai 클라이언트. 모듈 스코프에서 바로 new OpenAI()를 만들면
// OPENAI_API_KEY가 없는 환경에서 생성자가 즉시 던진다 - 문제는 이 모듈을
// import만 해도(실제로 호출 안 해도) 터진다는 것: Next.js가 빌드 중
// "Collecting page data"로 모든 라우트를 정적 분석하려고 import하는데,
// OPENAI_API_KEY를 Preview 환경엔 등록 안 한 Vercel PR 미리보기 같은 경우
// 그 시점에 빌드 자체가 실패한다. LLM-003/NFR-007("LLM 런타임 장애 시에도
// 나머지는 동작해야 함")과도 어긋나므로, 실제로 쓰는 시점(첫 요청)까지
// 생성을 미룬다.
let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  client ??= new OpenAI();
  return client;
}

// 사용 모델 환경변수
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// 동일 조건 입력에 동일한 추천 결과가 나오도록 샘플링
// temperature 0 + 고정 seed
export const OPENAI_TEMPERATURE = 0;
export const OPENAI_SEED = 42;
