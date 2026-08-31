'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import FormField from '@/shared/ui/FormField';
import TextField from '@/shared/ui/TextField';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import {
  formatIssuedDate,
  formatRrnBack,
  formatRrnFront,
} from '@/features/join/lib/format';
import {
  identitySchema,
  type IdentityValues,
} from '@/features/join/lib/identitySchema';

interface IdentityStepProps {
  submitLabel: string;
  /** 이전 단계로 다녀왔을 때 되살릴 입력값 (CARD-040) */
  defaultValues: IdentityValues;
  onNext: (values: IdentityValues) => void;
}

/**
 * CARD-035 / CARD-036: 본인 확인의 첫 갈래인 정보 인증.
 * 이름, 주민등록번호, 발급일자를 받고 형식이 맞을 때만 다음으로 넘긴다.
 */
export default function IdentityStep({
  submitLabel,
  defaultValues,
  onNext,
}: IdentityStepProps) {
  // 1. 상태 및 훅
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    mode: 'onSubmit',
    defaultValues,
  });

  // 2. 렌더링
  return (
    <JoinStepLayout submitLabel={submitLabel} onSubmit={handleSubmit(onNext)}>
      <div className="flex flex-col gap-3.5 pt-4">
        <FormField
          label="이름"
          htmlFor="join-name"
          error={errors.name?.message}
        >
          <TextField
            id="join-name"
            type="text"
            size="sm"
            placeholder="이름을 입력해주세요"
            isInvalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>

        <FormField
          label="주민등록번호"
          htmlFor="join-rrn-front"
          error={errors.rrnFront?.message ?? errors.rrnBack?.message}
        >
          <div className="flex items-center gap-1.5">
            {/* 배치(flex-1)는 감싸는 요소가 맡고, 입력 칸은 폭을 모른다 */}
            <div className="flex-1">
              <TextField
                id="join-rrn-front"
                type="text"
                inputMode="numeric"
                size="sm"
                placeholder="123456"
                format={formatRrnFront}
                isInvalid={Boolean(errors.rrnFront)}
                {...register('rrnFront')}
              />
            </div>

            <span aria-hidden className="text-12 text-text-secondary">
              -
            </span>

            {/* CARD-036: 뒷자리는 입력하는 동안에도 가린다 */}
            <div className="flex-1">
              <TextField
                id="join-rrn-back"
                type="password"
                inputMode="numeric"
                size="sm"
                placeholder="*******"
                aria-label="주민등록번호 뒷자리"
                format={formatRrnBack}
                isInvalid={Boolean(errors.rrnBack)}
                {...register('rrnBack')}
              />
            </div>
          </div>
        </FormField>

        <FormField
          label="주민등록 발급일자"
          htmlFor="join-issued-date"
          error={errors.issuedDate?.message}
        >
          <TextField
            id="join-issued-date"
            type="text"
            inputMode="numeric"
            size="sm"
            placeholder="2001.11.11"
            format={formatIssuedDate}
            isInvalid={Boolean(errors.issuedDate)}
            {...register('issuedDate')}
          />
        </FormField>
      </div>
    </JoinStepLayout>
  );
}
