'use client';

import { Fragment, useState, useSyncExternalStore } from 'react';

import { Check, MessageSquare, QrCode } from 'lucide-react';

import Button from '@/shared/ui/Button';

import { cn } from '@/shared/utils/cn';

import { OCTOMO_RECEIVER_NUMBER } from '@/features/join/data/mo';
import type { MoStatus } from '@/features/join/hooks/useMoVerification';
import { buildSmsHref, isMobileDevice } from '@/features/join/lib/moSchema';

/** 인증 방법 탭 */
type MoMethod = 'qr' | 'sms';

const MO_METHODS: { key: MoMethod; label: string }[] = [
  { key: 'qr', label: 'QR 코드 인증' },
  { key: 'sms', label: 'SMS 인증' },
];

/** 기기는 도중에 바뀌지 않아서 구독할 것이 없다 - 해지 함수만 돌려준다 */
const subscribeToNothing = () => () => {};

/** 서버에는 navigator 가 없다 - 그쪽에서는 PC 로 두고 화면에서 다시 읽는다 */
const readDeviceOnServer = () => false;

interface MoVerificationProps {
  status: MoStatus;
  isVerified: boolean;
  /** 문자로 보낼 인증 코드 */
  code: string;
  /** 지금 코드의 QR (PNG data URL). 아직 못 받았으면 null */
  qrCode: string | null;
  isQrLoading: boolean;
  secondsLeft: number;
  errorMessage: string | null;
  /** 번호 형식이 맞을 때만 인증을 시작할 수 있다 */
  isMobileNumValid: boolean;
  /** 인증 대기를 시작(또는 재시작)하고 이번 판에 쓸 코드를 돌려준다 */
  onStart: () => string;
  onLoadQrCode: (code: string) => void;
}

/** 남은 시간을 3:05 모양으로 */
function formatSecondsLeft(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * CARD-037: MO 본인 인증 화면.
 *
 * 인증 코드를 옥토모 대표번호로 보내면 서버가 수신 여부를 확인해 인증을 판정한다.
 * 화면에서 통과시킬 수 있는 자리가 없어서 실제로 문자를 보내야만 다음 단계로
 * 넘어간다.
 *
 * QR 코드 인증과 SMS 인증, 두 방법을 탭으로 나눠 사용자가 직접 골라 볼 수 있다.
 * 기본으로 뜨는 탭은 기기로 정한다 - 폰에서는 문자 앱을 바로 열 수 있어 SMS 인증이,
 * PC 에서는 문자 앱이 없어 QR 코드 인증이 기본이다. 기기 판정이 어긋났을 때는 탭을
 * 눌러 언제든 반대쪽으로 바꿀 수 있다.
 *
 * 진행 상태는 useMoVerification 이 들고 있다 - 다음 버튼을 잠그는 판단이
 * 부모(IdentityStep)에도 필요해서 훅을 그쪽에 두었다.
 */
export default function MoVerification({
  status,
  isVerified,
  code,
  qrCode,
  isQrLoading,
  secondsLeft,
  errorMessage,
  isMobileNumValid,
  onStart,
  onLoadQrCode,
}: MoVerificationProps) {
  // 1. 상태 및 훅
  // 기기는 그려진 뒤에야 알 수 있다 - 서버에는 navigator 가 없다. 서버 쪽 값을
  // 따로 두는 덕분에 첫 렌더가 서버와 어긋나지 않는다.
  const isMobile = useSyncExternalStore(
    subscribeToNothing,
    isMobileDevice,
    readDeviceOnServer,
  );
  const [chosenMethod, setChosenMethod] = useState<MoMethod | null>(null);

  // 사용자가 탭을 눌러본 적 없으면 기기에 맞는 쪽을 기본값으로 쓴다
  const method: MoMethod = chosenMethod ?? (isMobile ? 'sms' : 'qr');
  const isWaiting = status === 'waiting';

  // 2. 이벤트 핸들러
  // 대기를 먼저 시작해야 문자를 보내고 돌아왔을 때 이미 조회가 돌고 있다
  const handleSendSms = () => {
    const activeCode = onStart();

    // href 에 대입하는 대신 assign 을 쓴다 - 하는 일은 같은데, 대입은 React
    // Compiler 가 "바깥 값을 고치는 코드"로 보고 막는다.
    window.location.assign(buildSmsHref(activeCode));
  };

  const handleStartQr = () => {
    onLoadQrCode(onStart());
  };

  /**
   * 탭을 고른다. 폰에서 SMS 인증을 고른 그 손짓은 곧 "문자 보내기"이기도 해서,
   * 화면만 바꿔놓고 버튼을 한 번 더 누르게 하지 않고 바로 문자 앱을 연다.
   * PC 는 열어줄 앱이 없고, 번호가 아직 안 맞으면 보낼 것이 없으므로 탭만 바꾼다.
   */
  const handleSelectMethod = (next: MoMethod) => {
    setChosenMethod(next);

    if (next === 'sms' && isMobile && isMobileNumValid) handleSendSms();
  };

  return (
    <div className="flex flex-col gap-2 rounded-md bg-background-subtle p-3">
      {isVerified ? (
        <p className="flex items-center gap-1 text-12 font-medium text-status-success">
          <Check size={16} strokeWidth={2} aria-hidden />
          본인 인증이 완료되었습니다
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="본인 인증 방법"
            className="flex gap-4 border-b border-border-light"
          >
            {MO_METHODS.map((item, index) => {
              const isActive = item.key === method;

              return (
                <Fragment key={item.key}>
                  {/* 탭 사이를 가르는 세로줄 - 글자가 아니라 선이라 감춘다 */}
                  {index > 0 && (
                    <span
                      aria-hidden
                      className="my-1.5 w-px self-stretch bg-border-default"
                    />
                  )}

                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectMethod(item.key)}
                    className={cn(
                      'cursor-pointer border-b py-1.5 text-12 transition-colors',
                      isActive
                        ? 'border-action-primary font-medium text-action-primary'
                        : 'border-transparent text-text-secondary hover:text-action-primary',
                    )}
                  >
                    {item.label}
                  </button>
                </Fragment>
              );
            })}
          </div>

          {/*
            두 탭이 같이 쓰는 고정 높이다. 탭을 옮기거나 QR 을 받아 이미지가 뜨는
            순간에도 이 칸의 높이가 그대로라 카드가 튀지 않는다.
            가장 큰 상태(QR 이미지 96px + 안내 두 줄)에 맞춘 값이라 더 줄이면
            그 상태에서 넘친다. 안쪽 내용은 가운데로 모아 어느 상태에서도 빈 곳이
            한쪽으로 쏠리지 않게 한다.
          */}
          <div className="flex h-36 flex-col items-center justify-center gap-2">
            {method === 'qr' ? (
              isWaiting && qrCode !== null ? (
                <>
                  {/* 96px - 아래 안내 두 줄까지 h-36 안에 들어가는 크기다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element --
                      OCTOMO 가 돌려주는 PNG data URL 이라 next/image 가 최적화할
                      대상이 아니고, 문서가 지원한다고 밝힌 src 형태도 아니다. */}
                  <img
                    src={qrCode}
                    alt={`인증 문자용 QR 코드. 문자 내용은 ${code} 입니다`}
                    width={96}
                    height={96}
                    className="rounded-sm bg-background-default"
                  />

                  <p className="text-10 text-text-secondary">
                    QR 을 찍어 열린 문자를 그대로 보내주세요
                  </p>
                  <p className="text-10 font-medium text-action-primary">
                    {formatSecondsLeft(secondsLeft)} · 인증 내용 {code}
                  </p>
                </>
              ) : isWaiting && isQrLoading ? (
                <p className="text-10 text-text-secondary">QR 코드를 받는 중</p>
              ) : (
                <>
                  <p className="text-center text-10 leading-relaxed break-keep text-text-secondary">
                    휴대폰으로 QR 을 찍으면 {OCTOMO_RECEIVER_NUMBER} 로 보내는
                    문자 앱이 열립니다. 내용을 고치지 말고 그대로 보내주세요.
                  </p>

                  {status === 'expired' && (
                    <p className="text-10 text-status-error">
                      시간이 지났습니다. QR 을 다시 받아주세요.
                    </p>
                  )}

                  {errorMessage !== null && (
                    <p className="text-center text-10 text-status-error">
                      {errorMessage}
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    radius="sm"
                    size="md"
                    gap="sm"
                    isFullWidth
                    disabled={!isMobileNumValid}
                    onClick={handleStartQr}
                  >
                    <QrCode size={14} strokeWidth={1.5} aria-hidden />
                    {status === 'idle'
                      ? 'QR 코드 확인하기'
                      : 'QR 코드 다시 받기'}
                  </Button>
                </>
              )
            ) : isWaiting ? (
              <>
                <p className="text-center text-10 leading-relaxed break-keep text-text-secondary">
                  {OCTOMO_RECEIVER_NUMBER} 로 인증 내용 {code} 를 그대로
                  보내주세요
                </p>
                <p className="text-10 font-medium text-action-primary">
                  {formatSecondsLeft(secondsLeft)} 남음
                </p>

                <Button
                  type="button"
                  variant="outline"
                  radius="sm"
                  size="md"
                  gap="sm"
                  isFullWidth
                  onClick={handleSendSms}
                >
                  <MessageSquare size={14} strokeWidth={1.5} aria-hidden />
                  문자 앱 다시 열기
                </Button>
              </>
            ) : (
              <>
                <p className="text-center text-10 leading-relaxed break-keep text-text-secondary">
                  {OCTOMO_RECEIVER_NUMBER} 로 인증 문자를 보내면 완료됩니다.
                  내용을 고치지 말고 그대로 보내주세요.
                </p>

                {status === 'expired' && (
                  <p className="text-10 text-status-error">
                    시간이 지났습니다. 인증 문자를 다시 보내주세요.
                  </p>
                )}

                {errorMessage !== null && (
                  <p className="text-center text-10 text-status-error">
                    {errorMessage}
                  </p>
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
                  인증 문자 보내기
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
