import OpenAI from 'openai';

// 서버 전용 openai 클라이언트
export const openai = new OpenAI();

// 사용 모델 환경변수
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// 동일 조건 입력에 동일한 추천 결과가 나오도록 샘플링
// temperature 0 + 고정 seed
export const OPENAI_TEMPERATURE = 0;
export const OPENAI_SEED = 42;
