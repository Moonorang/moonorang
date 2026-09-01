'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import FormField from '@/shared/ui/FormField';
import TextField from '@/shared/ui/TextField';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import MoVerification from '@/features/join/components/MoVerification';
import { useMoVerification } from '@/features/join/hooks/useMoVerification';
import {
  formatIssuedDate,
  formatMobileNum,
  formatRrnBack,
  formatRrnFront,
} from '@/features/join/lib/format';
import {
  identitySchema,
  type IdentityValues,
} from '@/features/join/lib/identitySchema';
import { mobileNumSchema } from '@/features/join/lib/moSchema';

interface IdentityStepProps {
  submitLabel: string;
  /** 이전 단계로 다녀왔을 때 되살릴 입력값 (CARD-040) */
  defaultValues: IdentityValues;
  onNext: (values: IdentityValues) => void;
}

/**
 * CARD-035 ~ CARD-037: 본인 확인.
 * 정보 인증(이름·주민등록번호·발급일자)과 MO 본인 인증을 한 화면에서 받고,
 * 형식이 맞고 인증까지 끝났을 때만 다음으로 넘긴다.
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
    control,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    mode: 'onSubmit',
    defaultValues,
  });

  // 인증은 "지금 입력된 번호"로 하므로 폼 값을 그대로 따라간다.
  // 번호를 고치면 훅이 알아서 이전 인증을 무효로 본다.
  // watch() 대신 useWatch 를 쓰는 이유는, watch 가 돌려주는 함수를 메모이즈할 수
  // 없어서 React Compiler 가 이 컴포넌트 전체를 건너뛰기 때문이다.
  const mobileNum = useWatch({ control, name: 'mobileNum' }) ?? '';
  const mo = useMoVerification(mobileNum);

  // 2. 렌더링
  return (
    <JoinStepLayout
      submitLabel={submitLabel}
      onSubmit={handleSubmit(onNext)}
      isSubmitDisabled={!mo.isVerified}
    >
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

        <FormField
          label="휴대폰 번호"
          htmlFor="join-mobile-num"
          error={errors.mobileNum?.message}
        >
          <TextField
            id="join-mobile-num"
            type="tel"
            inputMode="numeric"
            size="sm"
            placeholder="01012345678"
            format={formatMobileNum}
            isInvalid={Boolean(errors.mobileNum)}
            {...register('mobileNum')}
          />
        </FormField>

        <MoVerification
          status={mo.status}
          isVerified={mo.isVerified}
          code={mo.code}
          smsHref={mo.smsHref}
          secondsLeft={mo.secondsLeft}
          errorMessage={mo.errorMessage}
          qrCode={mo.qrCode}
          isQrLoading={mo.isQrLoading}
          isMobileNumValid={mobileNumSchema.safeParse(mobileNum).success}
          onStart={mo.start}
          onLoadQrCode={() => void mo.loadQrCode()}
        />
      </div>
    </JoinStepLayout>
  );
}
