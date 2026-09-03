import { z } from 'zod';

import { getBirthFromRrn } from '@/features/join/lib/rrn';
import { mobileNumSchema } from '@/features/join/lib/moSchema';

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
const identityFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(20, '이름은 20자 이하로 입력해 주세요'),
  rrnFront: z
    .string()
    .regex(/^\d{6}$/, '주민등록번호 앞 6자리를 입력해 주세요'),
  // 뒷자리는 첫 숫자 하나만 받는다 - 여기서 필요한 것은 성별과 출생 세기뿐이고,
  // 나머지 6자리는 화면에서도 * 로만 보여주고 아예 입력받지 않는다.
  // 1·3·5·7 남자 / 2·4·6·8 여자 - 그 밖의 값은 성별을 알 수 없어 막는다.
  rrnGenderCode: z
    .string()
    .regex(/^[1-8]$/, '주민등록번호 뒷자리 첫 숫자를 확인해 주세요'),
  issuedDate: z
    .string()
    .regex(ISSUED_DATE_PATTERN, '발급일자를 2001.11.11 형식으로 입력해 주세요')
    .refine(isRealIssuedDate, '올바른 발급일자를 입력해 주세요'),
  // CARD-037: MO 인증 문자를 보낸 번호와 대조할 값
  mobileNum: mobileNumSchema,
});

/**
 * 앞 6자리와 뒷자리 첫 숫자를 합쳐 실제 생년월일이 나오는지까지 본다.
 * 자리 수만 맞고 99.13.01 같은 값이 들어오면 여기서 걸린다.
 */
export const identitySchema = identityFieldsSchema.refine(
  ({ rrnFront, rrnGenderCode }) =>
    getBirthFromRrn(rrnFront, rrnGenderCode) !== null,
  { message: '주민등록번호를 다시 확인해 주세요', path: ['rrnFront'] },
);

export type IdentityValues = z.infer<typeof identitySchema>;
