// entities/user Public API — 클라이언트에서 안전한 것만.
// 서버 전용(userRepository)은 @/entities/user/server 로 따로 가져간다.
export type { Gender, UserProfile, MonthlyUsage } from './types';
export {
  saveSignupPrefill,
  loadSignupPrefill,
  clearSignupPrefill,
  type SignupPrefill,
} from './lib/signupPrefill';
