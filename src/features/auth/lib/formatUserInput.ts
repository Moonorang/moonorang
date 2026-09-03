// 숫자만 남겨 010-1234-5678 형태로 변환
export function formatContact(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 숫자만 남겨 2001.11.11 형태로 변환
export function formatBirth(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

// 2001.11.11 → 2001-11-11 (users.birth의 date 컬럼 저장용)
export function toIsoBirth(value: string): string {
  return value.replaceAll('.', '-');
}

// 2001-11-11 → 2001.11.11 (가입 절차에서 받아온 값을 입력 칸 형식으로)
export function fromIsoBirth(value: string): string {
  return value.replaceAll('-', '.');
}
