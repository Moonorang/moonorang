// entities/plan Public API — 클라이언트에서 안전한 것만.
// 서버 전용(planRepository)은 @/entities/plan/server 로 따로 가져간다.
export { default as PlanCard } from './ui/PlanCard';
export {
  parseDataAllowance,
  parseDataAllowanceToGb,
  parseTetheringSharingGb,
  parseVoiceSms,
} from './lib/format';
export type { Plan, PlanBenefits, PlanOption } from './types';
