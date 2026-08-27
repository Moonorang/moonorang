'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';

import Button from '@/components/common/Button';

import { submitSignup } from '@/app/auth/signup/actions';
import { formatBirth, formatContact } from '@/utils/formatUserInput';
import { signupSchema, type SignupFormValues } from '@/utils/signupSchema';
import { cn } from '@/utils/cn';
import type { PlanOption } from '@/types/plan';
import type { Gender } from '@/types/user';

interface GenderOption {
  value: Gender;
  label: string;
}

// DB에는 CHECK 제약에 맞춰 MALE/FEMALE로 저장하고, 화면에는 남/여로 표시
const GENDER_OPTIONS: GenderOption[] = [
  { value: 'MALE', label: '남' },
  { value: 'FEMALE', label: '여' },
];

// 폼 내부 gap 20px, 라벨-필드 gap 8px
const GROUP_CLASS = 'flex flex-col gap-2';
const LABEL_CLASS = 'text-12 font-medium text-text-main';
const FIELD_CLASS =
  'w-full rounded-md border border-border-gray bg-neutral-pure-white px-4 py-3 text-14 text-text-main transition-colors outline-none placeholder:text-text-secondary focus:border-primary-red';
const ERROR_CLASS = 'text-12 text-semantic-error';

interface SignupFormProps {
  plans: PlanOption[];
  /** 카카오 닉네임 (이름 입력 초기값) */
  defaultName: string;
  /** 가입 완료 후 이동할 경로 */
  nextPath: string;
}

export default function SignupForm({
  plans,
  defaultName,
  nextPath,
}: SignupFormProps) {
  // 1. 상태 및 훅
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: defaultName,
      currentPlanId: '',
      contact: '',
      birth: '',
      gender: '',
    },
  });

  const contactField = register('contact');
  const birthField = register('birth');
  const selectedPlanId = useWatch({ control, name: 'currentPlanId' });
  const selectedGender = useWatch({ control, name: 'gender' });

  // 2. 이벤트 핸들러
  const handleGenderClick = (gender: Gender) => {
    // 선택 항목이므로 같은 값을 다시 누르면 해제
    setValue('gender', selectedGender === gender ? '' : gender);
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const { errorMessage } = await submitSignup(values);

    if (errorMessage) {
      setSubmitError(errorMessage);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  });

  // 3. 렌더링
  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className={GROUP_CLASS}>
        <label htmlFor="name" className={LABEL_CLASS}>
          이름을 입력해 주세요
        </label>
        <input
          id="name"
          type="text"
          placeholder="홍길동"
          className={FIELD_CLASS}
          {...register('name')}
        />
        {errors.name && <p className={ERROR_CLASS}>{errors.name.message}</p>}
      </div>

      <div className={GROUP_CLASS}>
        <label htmlFor="currentPlanId" className={LABEL_CLASS}>
          현재 어떤 요금제를 사용중 이신가요?
        </label>
        <div className="relative">
          <select
            id="currentPlanId"
            className={cn(
              FIELD_CLASS,
              'appearance-none pr-10',
              selectedPlanId === '' && 'text-text-secondary',
            )}
            {...register('currentPlanId')}
          >
            <option value="">요금제를 선택해 주세요</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-main"
          />
        </div>
        {errors.currentPlanId && (
          <p className={ERROR_CLASS}>{errors.currentPlanId.message}</p>
        )}
      </div>

      <div className={GROUP_CLASS}>
        <label htmlFor="contact" className={LABEL_CLASS}>
          연락처를 입력해 주세요
        </label>
        <input
          id="contact"
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-5678"
          className={FIELD_CLASS}
          {...contactField}
          onChange={(event) => {
            event.target.value = formatContact(event.target.value);
            contactField.onChange(event);
          }}
        />
        {errors.contact && (
          <p className={ERROR_CLASS}>{errors.contact.message}</p>
        )}
      </div>

      <div className={GROUP_CLASS}>
        <label htmlFor="birth" className={LABEL_CLASS}>
          성별과 생년월일을 입력해 주세요 (선택)
        </label>
        <div className="flex gap-2">
          <input
            id="birth"
            type="text"
            inputMode="numeric"
            placeholder="2001.11.11"
            className={cn(FIELD_CLASS, 'flex-1')}
            {...birthField}
            onChange={(event) => {
              event.target.value = formatBirth(event.target.value);
              birthField.onChange(event);
            }}
          />
          <div
            role="group"
            aria-label="성별"
            className="flex shrink-0 overflow-hidden rounded-md border border-border-gray"
          >
            {GENDER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleGenderClick(value)}
                aria-pressed={selectedGender === value}
                className={cn(
                  'w-11 py-3 text-14 transition-colors hover:cursor-pointer',
                  selectedGender === value
                    ? 'bg-primary-red text-neutral-pure-white'
                    : 'bg-neutral-pure-white text-text-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {errors.birth && <p className={ERROR_CLASS}>{errors.birth.message}</p>}
      </div>

      {submitError && (
        <p role="alert" className={ERROR_CLASS}>
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        variant="main"
        disabled={isSubmitting}
        className="w-full py-3 text-14 font-bold"
      >
        {isSubmitting ? '저장 중...' : '시작하기'}
      </Button>
    </form>
  );
}
