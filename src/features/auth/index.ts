// features/auth Public API (클라이언트에서 안전한 것만)
// 서버 전용은 @/features/auth/server 로 따로 가져간다.
export { default as SignupForm } from './components/SignupForm';
export { default as KakaoLoginButton } from './components/KakaoLoginButton';
export { default as GenderToggle } from './components/GenderToggle';
export { useAuth } from './hooks/useAuth';
export { signupSchema, type SignupFormValues } from './lib/signupSchema';
export {
  formatContact,
  formatBirth,
  toIsoBirth,
} from './lib/formatUserInput';
export { getDisplayName } from './lib/getDisplayName';
export { getKakaoNickname } from './lib/getKakaoNickname';
export { getLoginErrorMessage } from './lib/loginErrorMessage';
export { resolveNextPath } from './lib/resolveNextPath';
export type { Gender, UserRow } from './types';
