import OpenAI from 'openai';

// 서버 전용 openai 클라이언트
export const openai = new OpenAI();

// 사용 모델 환경변수
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
