/**
 * 화면에서만 쓰는 고유 식별자를 만든다.
 *
 * crypto.randomUUID 는 보안 컨텍스트(https 또는 localhost)에서만 있는 API라,
 * 같은 네트워크의 다른 기기에서 http://10.0.0.x:3000 처럼 열면 undefined 다.
 * 그대로 호출하면 그 자리에서 터져 채팅이 아예 동작하지 않으므로 있는지 확인하고 쓴다.
 *
 * 대체값은 UUID 규격이 아니어도 된다 - 이 값은 목록의 key 와
 * 스트리밍 대상 메시지를 가리는 데만 쓰이고 서버에 저장되지 않는다.
 */
export function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
