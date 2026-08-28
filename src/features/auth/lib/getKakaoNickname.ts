// 카카오 계정에서 받은 user_metadata 에서 닉네임을 뽑는다.
// 제공자에 따라 키가 달라서 후보를 순서대로 확인하고, 없으면 빈 문자열.
export function getKakaoNickname(metadata: Record<string, unknown>): string {
  const candidates = [
    metadata.name,
    metadata.full_name,
    metadata.preferred_username,
  ];
  const nickname = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== '',
  );

  return typeof nickname === 'string' ? nickname : '';
}
