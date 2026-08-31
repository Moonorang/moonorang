// plans.data_allowance를 화면에 나눠 보여줄 두 조각으로 분리
// DB 원문 형식: '무제한' | '120GB (소진 후 5Mbps)'
// 괄호가 없으면(무제한 등) throttleSpeed 는 undefined
export function parseDataAllowance(raw: string): {
  amount: string;
  throttleSpeed?: string;
} {
  const match = raw.match(/^(.*?)(?:\s*\(소진\s*후\s*([^)]+)\))?$/);
  const amount = match?.[1]?.trim() ?? raw;
  const throttleSpeed = match?.[2]?.trim();

  return throttleSpeed ? { amount, throttleSpeed } : { amount };
}

// 문자열 안에서 처음 나오는 '숫자GB'/'숫자MB' 패턴을 GB 숫자로 뽑아낸다.
// 못 찾으면 undefined - '무제한'인지 그냥 숫자 표현이 없는 값인지는 호출부가 판단한다.
function extractGb(text: string): number | undefined {
  const match = text.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return undefined;

  const [, value, unit] = match;
  const num = Number(value);

  return unit.toUpperCase() === 'MB' ? num / 1024 : num;
}

// plans.data_allowance를 비교·정렬용 GB 숫자로 변환한다.
// 화면 표시는 parseDataAllowance를 쓰고, 이 함수는 예산/사용량 기반 추천 채점(CARD-001)처럼
// 실제 계산이 필요한 곳에서만 쓴다.
// '무제한'처럼 숫자가 없는 값은 Infinity로 취급 - 상한이 없다는 뜻을 그대로 보존한다.
// (호출부가 정렬·점수 계산에 쓸 때는 Infinity를 다루기 쉬운 유한값으로 다시 치환해야 한다)
export function parseDataAllowanceToGb(raw: string): number {
  const { amount } = parseDataAllowance(raw);
  return extractGb(amount) ?? Number.POSITIVE_INFINITY;
}

// plans.benefits.tethering_sharing을 비교용 GB 숫자로 변환한다.
// 실제 DB 값 예시: '기본 제공량' | '기본 제공량 내 55GB' | '100GB' | undefined(혜택 없음)
// 숫자가 안 보이는 '기본 제공량'은 "데이터 요금제 안에서만 쓰라는 뜻 - 별도 쉐어링 여유 없음"으로
// 보고 0을 준다. 필드 자체가 없으면(하위 요금제) 마찬가지로 0.
export function parseTetheringSharingGb(raw?: string): number {
  if (!raw) return 0;
  if (raw.includes('무제한')) return Number.POSITIVE_INFINITY;

  return extractGb(raw) ?? 0;
}

// plans.voice_sms 를 통화/문자 두 줄로 분리
// DB 원문 형식은 항상 '{음성 기본} / {문자 기본} / {부가통화}' 세 조각
// (예: '기본제공 / 기본제공 / 300분 무료' -> call: '기본제공 + 부가통화 300분 무료', sms: '기본제공')
export function parseVoiceSms(raw: string): { call: string; sms: string } {
  const [voice, sms, bonus] = raw.split('/').map((part) => part.trim());

  return {
    call: bonus ? `${voice} + 부가통화 ${bonus}` : (voice ?? raw),
    sms: sms ?? '',
  };
}
