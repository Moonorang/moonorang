function countDigits(value: string): number {
  return value.replace(/\D/g, '').length;
}

// 포맷된 문자열에서 digitCount 번째 숫자 바로 뒤 위치
function findCaret(formatted: string, digitCount: number): number {
  if (digitCount === 0) return 0;

  let seen = 0;

  for (let index = 0; index < formatted.length; index += 1) {
    if (!/\d/.test(formatted[index])) continue;

    seen += 1;
    if (seen === digitCount) return index + 1;
  }

  return formatted.length;
}

/**
 * 입력값에 포맷을 적용하면서 커서 위치를 보존한다.
 * value 만 덮어쓰면 커서가 항상 맨 뒤로 밀려서 가운데 글자를 고칠 수 없다.
 * 커서 앞의 "숫자 개수"를 기준으로 삼아, 포맷 후 같은 자리로 되돌린다.
 *
 * 포맷 함수 자체(연락처·생년월일·카드번호 등)는 각 feature 가 갖고,
 * 커서를 되돌리는 이 규칙만 공용으로 둔다.
 */
export function applyMask(
  input: HTMLInputElement,
  format: (value: string) => string,
): void {
  const caretDigits = countDigits(
    input.value.slice(0, input.selectionStart ?? input.value.length),
  );
  const formatted = format(input.value);

  input.value = formatted;

  const caret = findCaret(formatted, caretDigits);
  input.setSelectionRange(caret, caret);
}
