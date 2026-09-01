'use client';

import { useEffect } from 'react';

import { X } from 'lucide-react';

import Button from '@/shared/ui/Button';

import { OCTOMO_RECEIVER_NUMBER } from '@/features/join/data/mo';

interface MoQrModalProps {
  /** 인증 코드를 담은 QR (PNG data URL). 발급 전에는 null */
  qrCode: string | null;
  isLoading: boolean;
  /** 문자로 보낼 인증 코드 - QR 을 못 읽는 경우를 위해 글자로도 보여준다 */
  code: string;
  /** 남은 시간 표시용 문구 (3:05 모양) */
  secondsLeftLabel: string;
  onClose: () => void;
}

/**
 * CARD-029 / CARD-037: MO 인증 QR 을 모달로 띄운다.
 *
 * 카드 안에 QR 을 넣으면 카드 높이가 확 늘어 대화가 튄다. 스캔은 한 번 하고 마는
 * 동작이라 잠깐 덮었다가 걷어내는 편이 맞다. 닫아도 인증 대기는 계속 돌기 때문에,
 * 문자를 보낸 뒤 모달을 닫아도 인증이 잡힌다.
 */
export default function MoQrModal({
  qrCode,
  isLoading,
  code,
  secondsLeftLabel,
  onClose,
}: MoQrModalProps) {
  // COMMON-005: 모달이 떠 있는 동안 배경 스크롤을 막는다
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // 열려 있는 동안 Escape 로 닫는다
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="본인 인증 QR 코드"
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-text-primary/50 px-4"
      onClick={onClose}
    >
      {/*
        배경을 눌러 닫되, 안쪽을 누른 것까지 닫히면 안 되므로 여기서 전파를 끊는다.
        키보드로는 위의 Escape 로 닫는다.
      */}
      <div
        className="flex w-full max-w-(--width-container) flex-col items-center gap-3 rounded-md bg-background-default p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between">
          <h4 className="text-14 font-medium text-text-primary">본인 인증</h4>

          <button
            type="button"
            onClick={onClose}
            aria-label="본인 인증 QR 코드 닫기"
            className="cursor-pointer text-text-secondary transition-colors hover:text-text-primary"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {qrCode === null ? (
          // 발급 전/실패 - 자리를 QR 과 같은 크기로 잡아둬야 모달이 덜컹이지 않는다
          <div className="flex h-50 w-50 items-center justify-center rounded-sm bg-background-subtle text-10 text-text-secondary">
            {isLoading ? 'QR 코드를 받는 중' : 'QR 코드를 받지 못했습니다'}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element --
             OCTOMO 가 돌려주는 PNG data URL 이라 next/image 가 최적화할 대상이
             아니고, 문서가 지원한다고 밝힌 src 형태도 아니다. */
          <img
            src={qrCode}
            alt={`인증 문자용 QR 코드. 문자 내용은 ${code} 입니다`}
            width={200}
            height={200}
            className="rounded-sm bg-background-default"
          />
        )}

        <p className="text-center text-12 text-text-primary">
          휴대폰으로 QR 을 찍으면 문자 앱이 열립니다.
          <br />
          내용을 고치지 말고 그대로 보내주세요.
        </p>

        <p className="text-10 text-text-secondary">
          받는 번호 {OCTOMO_RECEIVER_NUMBER} · 인증 내용 {code}
        </p>

        <p className="text-12 font-medium text-action-primary">
          {secondsLeftLabel} 남음
        </p>

        <Button
          type="button"
          variant="outline"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onClose}
        >
          문자 보냈어요
        </Button>
      </div>
    </div>
  );
}
