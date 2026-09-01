import { Check, RotateCcw } from 'lucide-react';

import Button from '@/shared/ui/Button';

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
 * CARD-037: MO 본인 인증 화면.
 *
 * 인증 코드가 담긴 QR 을 띄우면 사용자가 폰으로 스캔해 옥토모 대표번호로 문자를
 * 보내고, 그 수신 여부를 서버가 확인해 인증을 판정한다. 화면에서 통과시킬 수 있는
 * 자리가 없어서 실제로 문자를 보내야만 다음 단계로 넘어간다.
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
  const isIssuing = status === 'issuing';
  const isWaiting = status === 'waiting' && qrCode !== null;
  const startLabel = status === 'idle' ? 'QR 코드 확인하기' : '다시 받기';

  return (
    <div className="flex flex-col gap-2 rounded-md bg-background-subtle p-3">
      <p className="text-10 text-text-secondary">
        휴대폰으로 QR 을 찍으면 문자 앱이 열립니다. 내용을 고치지 말고 그대로
        보내주세요. (받는 번호 {OCTOMO_RECEIVER_NUMBER})
      </p>

      {isVerified ? (
        <p className="flex items-center gap-1 text-12 font-medium text-status-success">
          <Check size={16} strokeWidth={2} aria-hidden />
          본인 인증이 완료되었습니다
        </p>
      ) : (
        <>
          {isWaiting && (
            /*
              QR 을 글자 옆에 두면 안 된다 - 카드가 대화 폭의 80%라 QR(120)을 빼고
              나면 글자에 45px 밖에 안 남아 한두 자씩 끊긴다. 위아래로 쌓는다.
            */
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element --
                  OCTOMO 가 돌려주는 PNG data URL 이라 next/image 가 최적화할 대상이
                  아니고, 문서가 지원한다고 밝힌 src 형태도 아니다. */}
              <img
                src={qrCode}
                alt={`인증 문자용 QR 코드. 문자 내용은 ${code} 입니다`}
                width={160}
                height={160}
                className="rounded-sm bg-background-default"
              />

              <div className="flex flex-col items-center gap-1">
                <p className="text-12 font-medium text-text-primary">
                  문자 수신을 기다리는 중
                </p>
                <p className="text-10 text-text-secondary">인증 내용 {code}</p>
                <p className="text-10 font-medium text-action-primary">
                  {formatSecondsLeft(secondsLeft)} 남음
                </p>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <p className="text-10 text-status-error">
              시간이 지났습니다. 인증 문자를 다시 받아주세요.
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
            onClick={onStart}
          >
            <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
            {isIssuing ? '인증 문자 준비 중' : startLabel}
          </Button>
        </>
      )}
    </div>
  );
}
