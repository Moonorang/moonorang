const MB_PER_GB = 1024;

/**
 * 데이터량(MB)을 화면 표시용 문자열로. 1GB 미만은 MB 단위 그대로 보여준다 -
 * 그냥 GB로 반올림하면 "0GB"처럼 있는 값이 없는 것처럼 보이기 때문.
 */
export function formatMbLabel(mb: number): string {
  if (mb < MB_PER_GB) return `${Math.round(mb)}MB`;

  const gb = mb / MB_PER_GB;
  return gb >= 10 ? `${Math.round(gb)}GB` : `${Math.round(gb * 10) / 10}GB`;
}

/** GB 단위 값(users.remaining_data 등)을 화면 표시용 문자열로. */
export function formatGbLabel(gb: number): string {
  return formatMbLabel(gb * MB_PER_GB);
}

/**
 * 음성/문자 잔여량 표시용. "기본제공"은 사실상 무제한이라, 잔여량 배지에서는
 * "무제한"으로 더 명확하게 보여준다("+ 부가통화 300분" 같은 덧붙는 내용은 그대로 둔다).
 * 요금제 상세(PlanCard 등)에서 혜택 문구 그대로 보여줄 땐 이 변환을 쓰지 않는다.
 */
export function toUnlimitedLabel(text: string): string {
  return text.replace(/^기본제공/, '무제한');
}
