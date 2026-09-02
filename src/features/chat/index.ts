// features/chat Public API (클라이언트)
export { default as AddOnRecommendationCard } from './components/AddOnRecommendationCard';
export { default as AiMessage } from './components/AiMessage';
export { default as ChatRoom } from './components/ChatRoom';
export { default as ChatAvatar } from './components/ChatAvatar';
export { default as ChatBubble } from './components/ChatBubble';
export { default as ConditionQuestionCard } from './components/ConditionQuestionCard';
export { default as ChatErrorNotice } from './components/ChatErrorNotice';
export { default as ChatInput } from './components/ChatInput';
export { default as FloatingChatButton } from './components/FloatingChatButton';
export { default as FormattedMessage } from './components/FormattedMessage';
export { default as PlanCardCarousel } from './components/PlanCardCarousel';
export { default as PlusMenu } from './components/PlusMenu';
export { default as ReadAloudButton } from './components/ReadAloudButton';
export { default as ScrollToBottomButton } from './components/ScrollToBottomButton';
export { default as SubscriptionRecommendationCard } from './components/SubscriptionRecommendationCard';
export { default as SuggestionChips } from './components/SuggestionChips';
export { default as TypingIndicator } from './components/TypingIndicator';
export { default as UserMessage } from './components/UserMessage';
export { useChat, type ChatError } from './hooks/useChat';
export { useConditionQuestions } from './hooks/useConditionQuestions';
export {
  CONDITION_QUESTIONS,
  type ConditionQuestion,
} from './data/conditionQuestions';
export { WELCOME_MESSAGE } from './constants';
export { parseChatRequest } from './lib/schema';
export { formatSSEEvent, parseSSEEvent, SSE_HEADERS } from './lib/sse';
export { selectRecommendedPlans } from './lib/selectPlans';
export { selectRecommendedAddOns } from './lib/selectAddOns';
export { selectRecommendedSubscriptions } from './lib/selectSubscriptions';
export { mergeKeywords } from './lib/mergeKeywords';
export type {
  ChatMessage,
  ChatErrorReason,
  ChatStreamEvent,
  ChatRequestBody,
  ChatKeywords,
  PlanRecommendation,
  AddOnRecommendation,
  SubscriptionRecommendation,
  SummarizeTurnMessage,
  ChatSummarizeRequestBody,
  ChatSummarizeResponseBody,
} from './types';
export type { ScoredPlan, SelectRecommendedPlansResult } from './lib/selectPlans';
export type { ScoredAddOn } from './lib/selectAddOns';
export type { ScoredSubscription } from './lib/selectSubscriptions';
