'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { MO_POLL_INTERVAL_MS, MO_VALID_SECONDS } from '@/features/join/data/mo';
import { createMoCode } from '@/features/join/lib/moSchema';

export type MoStatus = 'idle' | 'waiting' | 'verified' | 'expired' | 'error';

/** 발급받은 QR 한 벌 - 어느 코드의 QR 인지 같이 들고 있어야 한다 */
interface MoQr {
  code: string;
  image: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };

    if (typeof body.message === 'string') return body.message;
  } catch {
    // 본문이 JSON 이 아닌 경우 - 아래 기본 문구로 넘어간다
  }

  return '본인 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

/**
 * CARD-037: MO 본인 인증의 진행 상태.
 *
 * QR 스캔과 문자 보내기는 같은 인증 코드/타이머를 공유하는 두 가지 방법일 뿐이다 -
 * 화면(MoVerification)이 탭으로 어느 쪽이든 골라 볼 수 있게 하므로, 어느 쪽으로
 * 시작해도 나머지 쪽 상태가 같이 따라와야 한다.
 *
 * 인증 코드는 화면에서 만든다 - 사용자가 그 코드를 문자로 보내면 서버가 수신을
 * 확인해 판정하므로, 코드 자체는 비밀이 아니고 서버가 미리 알고 있을 필요도 없다.
 * 덕분에 문자 앱을 여는 경로는 API 를 한 번도 부르지 않고 바로 시작한다.
 * QR 은 그 탭을 봤을 때만 따로 발급받는다.
 *
 * 번호를 고치면 이전 인증은 무효다. 상태를 지우는 대신 "어느 번호로 시작했는지"를
 * 같이 들고 있다가 지금 번호와 다르면 처음 상태로 보여준다 - 그래야 번호를
 * 되돌렸을 때 진행 중이던 인증이 그대로 살아난다.
 */
export function useMoVerification(mobileNum: string) {
  // 1. 상태
  const [code, setCode] = useState(createMoCode);
  const [targetNum, setTargetNum] = useState<string | null>(null);
  const [status, setStatus] = useState<MoStatus>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(MO_VALID_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qr, setQr] = useState<MoQr | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  // QR 을 이미 요청해 본 코드. 발급이 실패해도 화면은 QR 이 없는 상태 그대로라,
  // 이 표시가 없으면 같은 코드로 요청을 끝없이 되풀이한다.
  const requestedQrFor = useRef<string | null>(null);

  const isCurrentNumber = targetNum === mobileNum;
  const isPolling = isCurrentNumber && status === 'waiting';

  // 2. 부수 효과 - 남은 시간과 수신 조회를 같이 돌린다
  useEffect(() => {
    if (!isPolling) return;

    const controller = new AbortController();

    const countdown = setInterval(() => {
      const left =
        MO_VALID_SECONDS - Math.floor((Date.now() - startedAt) / 1000);

      setSecondsLeft(Math.max(0, left));
      if (left <= 0) setStatus('expired');
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const response = await fetch('/api/join/mo/exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNum, code }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setErrorMessage(await readErrorMessage(response));
          setStatus('error');
          return;
        }

        const body = (await response.json()) as { exists?: unknown };
        if (body.exists === true) setStatus('verified');
      } catch {
        // 일시적인 네트워크 오류 - 다음 주기에 다시 물어본다
      }
    }, MO_POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(countdown);
      clearInterval(poll);
    };
  }, [isPolling, mobileNum, code, startedAt]);

  // 3. 동작
  /**
   * 인증 대기를 시작(또는 다시 시작)하고, 이번 판에 쓸 인증 코드를 돌려준다.
   * 끝난 판(완료·만료·오류)에서 부르면 코드를 새로 만든다 - 지난 코드 그대로면
   * 아까 보낸 문자가 다시 잡혀 통과해버린다. 아직 대기 중일 때 다시 불러도(탭을
   * 옮기거나 재전송) 코드는 그대로 두고 남은 시간만 다시 채운다.
   *
   * 코드를 돌려주는 이유는, 부른 쪽이 그 자리에서 문자 링크를 만들거나 QR 을
   * 받아야 하는데 상태로 올라온 code 는 다음 렌더에나 새 값이 되기 때문이다.
   */
  const start = useCallback((): string => {
    const isFinished =
      !isCurrentNumber ||
      status === 'verified' ||
      status === 'expired' ||
      status === 'error';
    const nextCode = isFinished ? createMoCode() : code;

    if (isFinished) {
      setCode(nextCode);
      requestedQrFor.current = null;
    }

    setTargetNum(mobileNum);
    setErrorMessage(null);
    setStartedAt(Date.now());
    setSecondsLeft(MO_VALID_SECONDS);
    setStatus('waiting');

    return nextCode;
  }, [code, isCurrentNumber, mobileNum, status]);

  /** QR 발급 - 같은 코드로는 한 번만 요청한다(이미 받았거나 요청 중이면 건너뜀) */
  const loadQrCode = useCallback(async (targetCode: string) => {
    if (requestedQrFor.current === targetCode) return;

    requestedQrFor.current = targetCode;
    setIsQrLoading(true);

    try {
      const response = await fetch('/api/join/mo/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode }),
      });

      if (!response.ok) {
        setErrorMessage(await readErrorMessage(response));
        return;
      }

      const body = (await response.json()) as { qrCode?: unknown };

      if (typeof body.qrCode !== 'string') {
        setErrorMessage(
          '인증용 QR 코드를 받지 못했습니다. 다시 시도해 주세요.',
        );
        return;
      }

      setQr({ code: targetCode, image: body.qrCode });
    } catch {
      setErrorMessage(
        '인증 요청을 보내지 못했습니다. 네트워크를 확인해 주세요.',
      );
    } finally {
      setIsQrLoading(false);
    }
  }, []);

  return {
    /** 지금 입력된 번호 기준의 상태 - 번호를 고치면 처음 상태로 돌아간다 */
    status: isCurrentNumber ? status : ('idle' as MoStatus),
    isVerified: isCurrentNumber && status === 'verified',
    code,
    /** 지금 코드의 QR (PNG data URL) - 아직 못 받았으면 null */
    qrCode: qr !== null && qr.code === code ? qr.image : null,
    isQrLoading,
    secondsLeft,
    errorMessage: isCurrentNumber ? errorMessage : null,
    start,
    loadQrCode,
  };
}
