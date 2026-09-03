import { z } from 'zod';

const CONTACT_PATTERN = /^010-\d{4}-\d{4}$/;
const BIRTH_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const MIN_BIRTH_YEAR = 1900;

// 2001.11.11이 실제 존재하는 날짜이고 미래가 아닌지 확인 (2001.02.30 같은 값 차단)
function isRealBirth(value: string): boolean {
  const [year, month, day] = value.split('.').map(Number);
  const date = new Date(year, month - 1, day);

  const isExistingDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return (
    isExistingDate && year >= MIN_BIRTH_YEAR && date.getTime() <= Date.now()
  );
}

/**
 * 요금제 가입 절차의 본인 확인에서 이미 받아낸 항목들.
 * 선택 항목인 생년월일/성별은 미입력을 빈 문자열로 다룸.
 */
const profileFields = {
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(20, '이름은 20자 이하로 입력해 주세요'),
  contact: z
    .string()
    .min(1, '연락처를 입력해 주세요')
    .regex(CONTACT_PATTERN, '010-1234-5678 형식으로 입력해 주세요'),
  birth: z
    .string()
    .refine(
      (value) => value === '' || BIRTH_PATTERN.test(value),
      '생년월일을 2001.11.11 형식으로 입력해 주세요',
    )
    .refine(
      (value) => value === '' || isRealBirth(value),
      '올바른 생년월일을 입력해 주세요',
    ),
  gender: z.enum(['MALE', 'FEMALE']).or(z.literal('')),
};

/**
 * AUTH-006: 헤더 로그인으로 들어온 신규 회원이 채우는 추가 정보 화면.
 * 현재 이용 중인 요금제를 함께 받는다 - 이쪽 사용자는 이미 쓰던 요금제가 있다.
 */
export const signupSchema = z.object({
  ...profileFields,
  currentPlanId: z
    .string()
    .min(1, '현재 사용 중인 요금제를 선택해 주세요')
    .regex(/^\d+$/, '현재 사용 중인 요금제를 선택해 주세요'),
});

/**
 * AUTH-008: 요금제 가입 절차를 밟다 회원가입으로 넘어온 경우.
 *
 * currentPlanId 를 받지 않는다 - 지금 첫 요금제를 가입하는 중이라 "현재 이용
 * 요금제"라는 것이 아직 없고, 결제를 마치는 순간 completeJoin 이 방금 가입한
 * 요금제로 채운다. users.current_plan_id 도 nullable 이라 비워둘 수 있다.
 */
export const joinFlowSignupSchema = z.object(profileFields);

export type SignupFormValues = z.infer<typeof signupSchema>;
export type JoinFlowSignupValues = z.infer<typeof joinFlowSignupSchema>;
