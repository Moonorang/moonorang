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
