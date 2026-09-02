import type { Gender } from '@/entities/user/types';

/**
 * 주민등록번호 뒷자리 첫 숫자가 나타내는 출생 세기.
 * 1·2 는 1900년대, 3·4 는 2000년대이고 5~8 은 각각의 외국인 코드다.
 */
const CENTURY_BY_GENDER_CODE: Record<string, number> = {
  '1': 1900,
  '2': 1900,
  '5': 1900,
  '6': 1900,
  '3': 2000,
  '4': 2000,
  '7': 2000,
  '8': 2000,
};

/**
 * 뒷자리 첫 숫자로 성별을 가른다.
 * 1·3·5·7 은 남자, 2·4·6·8 은 여자다 - 홀짝만 보면 되므로 세기는 따지지 않는다.
 * 형식이 맞지 않으면 null 을 준다 (아직 입력 전이거나 잘못된 값).
 */
export function getGenderFromRrnCode(code: string): Gender | null {
  if (!/^[1-8]$/.test(code)) return null;

  return Number(code) % 2 === 1 ? 'MALE' : 'FEMALE';
}

/**
 * 앞 6자리(YYMMDD)와 뒷자리 첫 숫자로 생년월일을 만든다 (YYYY-MM-DD).
 *
 * 앞자리만으로는 1999년생인지 2099년생인지 알 수 없어서, 세기를 알려주는 뒷자리
 * 첫 숫자가 함께 있어야 한다. 실제로 없는 날짜(02.30)나 미래 날짜면 null 이다.
 */
export function getBirthFromRrn(
  rrnFront: string,
  genderCode: string,
): string | null {
  const century = CENTURY_BY_GENDER_CODE[genderCode];

  if (century === undefined || !/^\d{6}$/.test(rrnFront)) return null;

  const month = rrnFront.slice(2, 4);
  const day = rrnFront.slice(4, 6);
  const year = century + Number(rrnFront.slice(0, 2));

  const date = new Date(year, Number(month) - 1, Number(day));
  const isExistingDate =
    date.getFullYear() === year &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  if (!isExistingDate || date.getTime() > Date.now()) return null;

  return `${year}-${month}-${day}`;
}
