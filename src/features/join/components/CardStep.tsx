'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import FormField from '@/shared/ui/FormField';
import SelectField from '@/shared/ui/SelectField';
import TextField from '@/shared/ui/TextField';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import { CARD_ISSUERS } from '@/features/join/data/cardIssuers';
import { cardSchema, type CardValues } from '@/features/join/lib/cardSchema';
import { formatCardNumber, formatExpiry } from '@/features/join/lib/format';

interface CardStepProps {
  submitLabel: string;
  /** 이전 단계로 다녀왔을 때 되살릴 입력값 (CARD-040) */
  defaultValues: CardValues;
  onPrev: () => void;
  onNext: (values: CardValues) => void;
}

/**
 * CARD-038: 카드 등록. 카드사·카드 번호·유효기간을 받는다.
 *
 * 더미 처리라 서버로 보내지도, 저장하지도 않는다 - 값은 이 폼과 부모 카드의
 * state 안에서만 산다. 대화 내역(useChat)이나 localStorage 로는 절대 흘리지 않는다.
 * 최종 확인에 남길 때는 maskCardNumber 로 뒤 4자리만 쓴다.
 */
export default function CardStep({
  submitLabel,
  defaultValues,
  onPrev,
  onNext,
}: CardStepProps) {
  // 1. 상태 및 훅
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    mode: 'onSubmit',
    defaultValues,
  });

  // 고르기 전에는 안내 문구를 흐리게 보여준다
  const issuer = useWatch({ control, name: 'issuer' }) ?? '';

  // 2. 렌더링
  return (
    <JoinStepLayout
      submitLabel={submitLabel}
      onSubmit={handleSubmit(onNext)}
      onPrev={onPrev}
    >
      <div className="flex flex-col gap-3.5 pt-4">
        <FormField
          label="카드 번호"
          htmlFor="join-card-number"
          error={errors.cardNumber?.message ?? errors.issuer?.message}
        >
          <div className="flex items-center gap-1.5">
            {/*
              배치(flex)는 감싸는 요소가 맡고, 입력 칸은 폭을 모른다.
              min-w-0 이 없으면 flex 자식이 기본값 min-width:auto 라 placeholder 폭
              아래로 안 줄어들고, 그만큼 옆 칸을 화면 밖으로 밀어낸다(NFR-010).
            */}
            <div className="min-w-0 flex-2">
              <TextField
                id="join-card-number"
                type="text"
                inputMode="numeric"
                size="sm"
                placeholder="카드 번호를 입력해주세요"
                autoComplete="off"
                format={formatCardNumber}
                isInvalid={Boolean(errors.cardNumber)}
                {...register('cardNumber')}
              />
            </div>

            <div className="min-w-0 flex-1">
              <SelectField
                size="sm"
                placeholder="카드사"
                isPlaceholder={issuer === ''}
                options={CARD_ISSUERS}
                isInvalid={Boolean(errors.issuer)}
                aria-label="카드사"
                {...register('issuer')}
              />
            </div>
          </div>
        </FormField>

        <FormField
          label="카드 유효기간"
          htmlFor="join-card-expiry"
          error={errors.expiry?.message}
        >
          <TextField
            id="join-card-expiry"
            type="text"
            inputMode="numeric"
            size="sm"
            placeholder="유효기간(MMYY)"
            autoComplete="off"
            format={formatExpiry}
            isInvalid={Boolean(errors.expiry)}
            {...register('expiry')}
          />
        </FormField>
      </div>
    </JoinStepLayout>
  );
}
