'use client';

import { useState } from 'react';

import { Check, MessageSquare } from 'lucide-react';

import Button from '@/shared/ui/Button';

import MoQrModal from '@/features/join/components/MoQrModal';
import { OCTOMO_RECEIVER_NUMBER } from '@/features/join/data/mo';
import type { MoStatus } from '@/features/join/hooks/useMoVerification';

interface MoVerificationProps {
  status: MoStatus;
  isVerified: boolean;
  /** 문자로 보낼 인증 코드 */
  code: string;
  /** 누르면 수신번호와 본문이 채워진 채로 문자 앱이 열린다 */
  smsHref: string;
  secondsLeft: number;
  errorMessage: string | null;
  /** PC 처럼 문자 앱이 없는 경우를 위한 QR (PNG data URL) */
  qrCode: string | null;
  isQrLoading: boolean;
  /** 번호 형식이 맞을 때만 인증을 시작할 수 있다 */
  isMobileNumValid: boolean;
  onStart: () => void;
  onLoadQrCode: () => void;
}

/** 남은 시간을 3:05 모양으로 */
function formatSecondsLeft(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * CARD-037: MO 본인 인증.
 *
 * 기본 경로는 문자 앱 열기다 - 모바일 서비스라 대부분 폰에서 열고, 그때는 QR 을
 * 찍을 두 번째 기기가 없다. 대신 문자 앱이 없는 PC 를 위해 QR 을 보조로 남긴다.
 *
 * 카드에는 버튼 한 줄과 보조 링크만 두어 어느 상태에서도 높이가 변하지 않는다 -
 * QR 은 모달로 덮어서 띄운다.
 */
export default function MoVerification({
  status,
  isVerified,
  code,
  smsHref,
  secondsLeft,
  errorMessage,
  qrCode,
  isQrLoading,
  isMobileNumValid,
  onStart,
  onLoadQrCode,
}: MoVerificationProps) {
  // 1. 상태 및 훅
  const [isModalRequested, setIsModalRequested] = useState(false);

  // 인증이 끝났거나 시간이 지났으면 QR 을 띄워둘 이유가 없다.
  // 상태를 지우는 대신 이렇게 파생시켜야 렌더 도중에 상태를 바꾸지 않는다.
  const isModalOpen = isModalRequested && !isVerified && status !== 'expired';

  // 2. 이벤트 핸들러
  // 대기를 먼저 시작해야 문자를 보내고 돌아왔을 때 이미 조회가 돌고 있다
  const handleSendSms = () => {
    onStart();
    window.location.href = smsHref;
  };

  const handleOpenQr = () => {
    onStart();
    setIsModalRequested(true);
    onLoadQrCode();
  };

  // 3. 렌더링
  const isWaiting = status === 'waiting';

  return (
    <div className="flex flex-col gap-2 rounded-md bg-background-subtle p-3">
      <p className="text-10 text-text-secondary">
        {OCTOMO_RECEIVER_NUMBER} 로 인증 문자를 보내면 완료됩니다. 내용을 고치지
        말고 그대로 보내주세요.
      </p>

      {isVerified ? (
        <p className="flex items-center gap-1 text-12 font-medium text-status-success">
          <Check size={16} strokeWidth={2} aria-hidden />
          본인 인증이 완료되었습니다
        </p>
      ) : (
        <>
          {status === 'expired' && (
            <p className="text-10 text-status-error">
              시간이 지났습니다. 인증 문자를 다시 보내주세요.
            </p>
          )}

          {status === 'error' && errorMessage && (
            <p className="text-10 text-status-error">{errorMessage}</p>
          )}

          <Button
            type="button"
            variant="outline"
            radius="sm"
            size="md"
            gap="sm"
            isFullWidth
            disabled={!isMobileNumValid}
            onClick={handleSendSms}
          >
            <MessageSquare size={14} strokeWidth={1.5} aria-hidden />
            {isWaiting
              ? `문자 앱 다시 열기 · ${formatSecondsLeft(secondsLeft)}`
              : '인증 문자 보내기'}
          </Button>

          {/* 문자 앱이 없는 PC 용 보조 경로 */}
          <button
            type="button"
            onClick={handleOpenQr}
            disabled={!isMobileNumValid}
            className="cursor-pointer text-10 text-text-secondary underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            PC 라면 QR 코드로 보내기
          </button>
        </>
      )}

      {isModalOpen && (
        <MoQrModal
          qrCode={qrCode}
          code={code}
          isLoading={isQrLoading}
          secondsLeftLabel={formatSecondsLeft(secondsLeft)}
          onClose={() => setIsModalRequested(false)}
        />
      )}
    </div>
  );
}
