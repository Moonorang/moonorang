'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import FormField from '@/shared/ui/FormField';
import TextField from '@/shared/ui/TextField';
import { FIELD_BASE_CLASS, FIELD_SIZE_STYLES } from '@/shared/ui/fieldSize';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import MoVerification from '@/features/join/components/MoVerification';
import { useMoVerification } from '@/features/join/hooks/useMoVerification';
import {
  formatIssuedDate,
  formatMobileNum,
  formatRrnFront,
  formatRrnGenderCode,
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
          error={errors.rrnFront?.message ?? errors.rrnGenderCode?.message}
        >
          <div className="flex items-center gap-1.5">
            {/*
              배치는 감싸는 요소가 맡고, 입력 칸은 폭을 모른다.

              폭은 받는 자릿수에 딱 맞춘다 - 숫자 6자 + 좌우 안쪽 여백. ch 는
              숫자 0 한 자의 실제 폭이라 글꼴이 달라져도 따라오고, 1.75rem 은
              px-3 양쪽(24px)과 테두리(2px) 몫이다. 늘지도 줄지도 않아야
              6자리가 잘리지도, 빈 자리가 남지도 않는다.

              text-12 를 여기 같이 두는 이유는 ch 가 "이 요소의" 글자 크기로
              계산되기 때문이다 - 안 주면 물려받은 16px 로 재서 칸이 20px 쯤
              넓어지고, 그 여백이 전부 오른쪽에 몰려 글자가 왼쪽으로 쏠린다.
              남는 자리는 text-center 로 좌우에 고르게 나눈다(TextField 는
              className 을 안 받으므로 물려받는 속성으로 정해준다).
            */}
            <div className="w-[calc(6ch_+_1.75rem)] shrink-0 text-center text-12">
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

            {/*
              CARD-036: 뒷자리에서 실제로 받는 것은 첫 한 자리뿐이다. 성별과 출생
              세기를 알려주는 자리라 이것만 있으면 되고, 나머지 여섯 자리는 받지도
              저장하지도 않는다 - 안 받는다는 게 보이도록 * 만 그려둔다.

              폭은 한 자리에 맞춰 w-9(36px)로 잡는다. 입력 칸의 좌우 안쪽 여백이
              24px 이니 글자가 설 자리는 12px 이고, 12px 글씨의 숫자 한 자(약 7px)가
              여기 들어간다. w-8(32px) 부터는 남는 자리가 없어 찌그러진다.
              양옆 칸과 달리 줄어들면 안 되는 자리라 shrink-0 로 고정한다.

              글자는 가운데로 모아 남는 자리가 한쪽으로 쏠리지 않게 한다.
              text-align 은 물려받는 속성이라 감싸는 요소에서 정해주면 되고,
              TextField 는 className 을 받지 않으므로 이 방법이어야 한다.
            */}
            <div className="w-9 shrink-0 text-center">
              <TextField
                id="join-rrn-gender-code"
                type="text"
                inputMode="numeric"
                size="sm"
                placeholder="1"
                aria-label="주민등록번호 뒷자리 첫 숫자"
                format={formatRrnGenderCode}
                isInvalid={Boolean(errors.rrnGenderCode)}
                {...register('rrnGenderCode')}
              />
            </div>

            {/*
              입력 칸이 아니라 자리를 채우는 그림이라 보조기술에서는 감춘다.
              폭이 모자랄 때 먼저 양보하는 쪽이라(min-w-0), 좁아지면 * 개수가
              보이는 만큼만 남는다 - 칸 밖으로 삐져나가지 않게 overflow-hidden.
            */}
            <p
              aria-hidden
              className={`${FIELD_BASE_CLASS} ${FIELD_SIZE_STYLES.sm} min-w-0 flex-1 overflow-hidden tracking-widest text-text-secondary`}
            >
              ******
            </p>
          </div>

          <p className="text-10 text-text-secondary">
            뒷자리는 성별 확인에 필요한 첫 자리만 받아요.
          </p>
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
          qrCode={mo.qrCode}
          isQrLoading={mo.isQrLoading}
          secondsLeft={mo.secondsLeft}
          errorMessage={mo.errorMessage}
          isMobileNumValid={mobileNumSchema.safeParse(mobileNum).success}
          onStart={mo.start}
          onLoadQrCode={mo.loadQrCode}
        />
      </div>
    </JoinStepLayout>
  );
}
