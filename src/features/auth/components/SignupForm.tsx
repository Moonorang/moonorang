'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import Button from '@/shared/ui/Button';
import FormField from '@/shared/ui/FormField';
import SelectField from '@/shared/ui/SelectField';
import TextField from '@/shared/ui/TextField';

import GenderToggle from '@/features/auth/components/GenderToggle';
import {
  formatBirth,
  formatContact,
} from '@/features/auth/lib/formatUserInput';
import {
  signupSchema,
  type SignupFormValues,
} from '@/features/auth/lib/signupSchema';
import { submitSignup } from '@/features/auth/server/actions';
import type { PlanOption } from '@/entities/plan/types';

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

  const selectedPlanId = useWatch({ control, name: 'currentPlanId' });
  const selectedGender = useWatch({ control, name: 'gender' });

  // 2. 이벤트 핸들러
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
      <FormField
        label="이름을 입력해 주세요"
        htmlFor="name"
        error={errors.name?.message}
      >
        <TextField
          id="name"
          type="text"
          placeholder="홍길동"
          isInvalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>

      <FormField
        label="현재 어떤 요금제를 사용중 이신가요?"
        htmlFor="currentPlanId"
        error={errors.currentPlanId?.message}
      >
        <SelectField
          id="currentPlanId"
          placeholder="요금제를 선택해 주세요"
          isPlaceholder={selectedPlanId === ''}
          isInvalid={Boolean(errors.currentPlanId)}
          options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
          {...register('currentPlanId')}
        />
      </FormField>

      <FormField
        label="연락처를 입력해 주세요"
        htmlFor="contact"
        error={errors.contact?.message}
      >
        <TextField
          id="contact"
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-5678"
          format={formatContact}
          isInvalid={Boolean(errors.contact)}
          {...register('contact')}
        />
      </FormField>

      <FormField
        label="성별과 생년월일을 입력해 주세요 (선택)"
        htmlFor="birth"
        error={errors.birth?.message}
      >
        <div className="flex gap-2">
          {/* 배치(flex-1)는 감싸는 요소가 맡고, 입력 칸은 폭을 모른다 */}
          <div className="flex-1">
            <TextField
              id="birth"
              type="text"
              inputMode="numeric"
              placeholder="2001.11.11"
              format={formatBirth}
              isInvalid={Boolean(errors.birth)}
              {...register('birth')}
            />
          </div>
          <GenderToggle
            value={selectedGender}
            onChange={(gender) => setValue('gender', gender)}
          />
        </div>
      </FormField>

      {submitError && (
        <p role="alert" className="text-12 text-semantic-error">
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
