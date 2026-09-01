'use client';

import { useState } from 'react';

import { Check, QrCode } from 'lucide-react';

import Button from '@/shared/ui/Button';

import MoQrModal from '@/features/join/components/MoQrModal';
import { OCTOMO_RECEIVER_NUMBER } from '@/features/join/data/mo';
import type { MoStatus } from '@/features/join/hooks/useMoVerification';

interface MoVerificationProps {
  status: MoStatus;
  isVerified: boolean;
  /** 인증 코드를 담은 QR (PNG data URL) */
  qrCode: string | null;
  /** 문자로 보낼 인증 코드 - QR 을 못 읽는 경우를 위해 글자로도 보여준다 */
  code: string | null;
  secondsLeft: number;
  errorMessage: string | null;
  /** 번호 형식이 맞을 때만 인증을 시작할 수 있다 */
  isMobileNumValid: boolean;
  onStart: () => void;
}

/** 남은 시간을 3:05 모양으로 */
function formatSecondsLeft(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * CARD-037: MO 본인 인증.
 *
 * QR 은 모달로 띄운다 - 카드 안에 넣으면 QR 높이만큼 카드가 늘어 대화가 튄다.
 * 카드에는 버튼 한 줄만 두어 어느 상태에서도 높이가 변하지 않는다.
 *
 * 진행 상태는 useMoVerification 이 들고 있다 - 다음 버튼을 잠그는 판단이
 * 부모(IdentityStep)에도 필요해서 훅을 그쪽에 두었다.
 */
export default function MoVerification({
  status,
  isVerified,
  qrCode,
  code,
  secondsLeft,
  errorMessage,
  isMobileNumValid,
  onStart,
}: MoVerificationProps) {
  // 1. 상태 및 훅
  const [isModalRequested, setIsModalRequested] = useState(false);

  // 인증이 끝났거나 시간이 지났으면 QR 을 띄워둘 이유가 없다.
  // 상태를 지우는 대신 이렇게 파생시켜야 렌더 도중에 상태를 바꾸지 않는다.
  const isModalOpen =
    isModalRequested &&
    status === 'waiting' &&
    qrCode !== null &&
    code !== null;

  // 2. 이벤트 핸들러
  const handleStart = () => {
    setIsModalRequested(true);
    onStart();
  };

  // 3. 렌더링
  const isIssuing = status === 'issuing';
  const isWaiting = status === 'waiting';

  const buttonLabel = isIssuing
    ? 'QR 코드 준비 중'
    : isWaiting
      ? `QR 코드 다시 보기 · ${formatSecondsLeft(secondsLeft)}`
      : status === 'idle'
        ? 'QR 코드 확인하기'
        : 'QR 코드 다시 받기';

  const handleButtonClick = () => {
    // 대기 중이면 이미 받아둔 QR 을 다시 띄우기만 한다 - 코드를 새로 받으면
    // 사용자가 방금 보낸 문자가 헛것이 된다
    if (isWaiting) {
      setIsModalRequested(true);
      return;
    }

    handleStart();
  };

  return (
    <div className="flex flex-col gap-2 rounded-md bg-background-subtle p-3">
      <p className="text-10 text-text-secondary">
        QR 을 휴대폰으로 찍어 {OCTOMO_RECEIVER_NUMBER} 로 문자를 보내면 인증이
        완료됩니다.
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
              시간이 지났습니다. QR 코드를 다시 받아주세요.
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
            disabled={!isMobileNumValid || isIssuing}
            onClick={handleButtonClick}
          >
            <QrCode size={14} strokeWidth={1.5} aria-hidden />
            {buttonLabel}
          </Button>
        </>
      )}

      {isModalOpen && (
        <MoQrModal
          qrCode={qrCode}
          code={code}
          secondsLeftLabel={formatSecondsLeft(secondsLeft)}
          onClose={() => setIsModalRequested(false)}
        />
      )}
    </div>
  );
}
