// AUTH-004 / NFR-011: 콜백이 붙여 보내는 실패 사유를
// "무엇이 잘못됐는지 + 무엇을 하면 되는지"가 담긴 문구로 바꾼다.
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  missing_code: '카카오 로그인이 취소되었어요. 다시 시도해 주세요.',
  auth_failed: '로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
};

export function getLoginErrorMessage(code?: string | null): string | null {
  if (!code) return null;

  return (
    LOGIN_ERROR_MESSAGES[code] ?? '로그인에 실패했어요. 다시 시도해 주세요.'
  );
}
