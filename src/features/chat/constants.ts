// CHAT-002: 최초 진입 시 보여주는 서비스 안내와 상담 유형
export const WELCOME_MESSAGE = `안녕하세요! 😊
저는 LG 유플러스 AI 어시스턴트 무너예요.

다음과 같은 도움을 드릴 수 있어요
• 요금제 추천해주세요
• 내 요금제 절약해주세요

궁금한 점이 있으시면 언제든지 물어보세요!`;

// CHAT-011: 비회원 대화를 브라우저에만 저장할 때 쓰는 localStorage 키.
// 저장 구조가 바뀌면(마이그레이션 없이) 버전을 올려서 예전 값을 무시하게 한다.
export const CHAT_STORAGE_KEY = 'moonorang:chat:v1';

// chat-api-design.md §2.6 - 미요약 8턴(=16개 메시지) 도달 시 요약, 최근 3턴은 제외.
// 이 기준은 LLM 프롬프트 토큰 관리 목적이라 화면 표시 개수와는 별개로 유지한다.
export const SUMMARIZE_TURN_THRESHOLD = 8;
export const SUMMARIZE_KEEP_RECENT_TURNS = 3;

// 화면/로컬 저장에 원문으로 유지하는 최대 턴 수 - 멘토링 피드백대로 렌더링
// 성능·로컬 저장 부담 기준으로는 러프하게 잡아도 된다는 판단으로 넉넉하게 잡음.
// 이미 요약에 반영된(=SUMMARIZE_TURN_THRESHOLD 주기를 지난) 턴만 이 상한을 넘길 때
// 화면에서도 걷어낸다 - 아직 요약 안 된 턴은 절대 화면에서 지우지 않는다.
export const MAX_VISIBLE_TURNS = 24;
