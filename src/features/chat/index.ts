// features/chat Public API (클라이언트)
export { default as AiMessage } from './components/AiMessage';
export { default as ChatRoom } from './components/ChatRoom';
export { default as ChatAvatar } from './components/ChatAvatar';
export { default as ChatBubble } from './components/ChatBubble';
export { default as ChatErrorNotice } from './components/ChatErrorNotice';
export { default as ChatInput } from './components/ChatInput';
export { default as PlanCardCarousel } from './components/PlanCardCarousel';
export { default as PlusMenu } from './components/PlusMenu';
export { default as ReadAloudButton } from './components/ReadAloudButton';
export { default as ScrollToBottomButton } from './components/ScrollToBottomButton';
export { default as SuggestionChips } from './components/SuggestionChips';
export { default as UserMessage } from './components/UserMessage';
export { useChat, type ChatError } from './hooks/useChat';
export { WELCOME_MESSAGE, WELCOME_CREATED_AT } from './constants';
export { parseChatRequest } from './lib/schema';
export { formatSSEEvent, parseSSEEvent, SSE_HEADERS } from './lib/sse';
export { selectRecommendedPlans } from './lib/selectPlans';
export { mergeKeywords } from './lib/mergeKeywords';
export type {
  ChatMessage,
  ChatErrorReason,
  ChatStreamEvent,
  ChatRequestBody,
  ChatKeywords,
  PlanRecommendation,
} from './types';
export type { ScoredPlan, SelectRecommendedPlansResult } from './lib/selectPlans';
