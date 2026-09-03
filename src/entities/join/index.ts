// entities/join Public API — 가입 절차를 features 끼리 주고받는 값 (CARD-029~046)
export type { JoinItem, JoinKind, JoinProgress, JoinTarget } from './types';
export { getJoinKey } from './lib/joinKey';
export { isJoinKind } from './lib/joinKind';
export {
  clearPendingJoinPayment,
  hasPendingJoinPayment,
  savePendingJoinPayment,
} from './lib/pendingPayment';
export {
  buildAddOnJoinMessage,
  buildPlanJoinMessage,
  buildSubscriptionJoinMessage,
} from './lib/joinMessage';
