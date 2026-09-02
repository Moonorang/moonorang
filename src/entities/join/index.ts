// entities/join Public API — 가입 절차를 features 끼리 주고받는 값 (CARD-029~046)
export type { JoinKind, JoinProgress, JoinTarget } from './types';
export { getJoinKey, isSameJoinTarget } from './lib/joinKey';
export {
  buildAddOnJoinMessage,
  buildPlanJoinMessage,
  buildSubscriptionJoinMessage,
} from './lib/joinMessage';
