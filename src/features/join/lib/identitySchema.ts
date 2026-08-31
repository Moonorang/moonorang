import { z } from 'zod';

const ISSUED_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
// 주민등록증 제도가 시작된 해. 이보다 앞선 발급일자는 오타로 본다
const MIN_ISSUED_YEAR = 1968;

// 2001.02.30 같은 값과 미래 날짜를 걸러낸다
function isRealIssuedDate(value: string): boolean {
  const [year, month, day] = value.split('.').map(Number);
  const date = new Date(year, month - 1, day);

  const isExistingDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return (
    isExistingDate && year >= MIN_ISSUED_YEAR && date.getTime() <= Date.now()
  );
}

/** CARD-036 / CARD-039: 정보 인증 입력값과 항목별 오류 문구 */
export const identitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(20, '이름은 20자 이하로 입력해 주세요'),
  rrnFront: z
    .string()
    .regex(/^\d{6}$/, '주민등록번호 앞 6자리를 입력해 주세요'),
  rrnBack: z.string().regex(/^\d{7}$/, '주민등록번호 뒤 7자리를 입력해 주세요'),
  issuedDate: z
    .string()
    .regex(ISSUED_DATE_PATTERN, '발급일자를 2001.11.11 형식으로 입력해 주세요')
    .refine(isRealIssuedDate, '올바른 발급일자를 입력해 주세요'),
});

export type IdentityValues = z.infer<typeof identitySchema>;
