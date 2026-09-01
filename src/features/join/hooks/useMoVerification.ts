'use client';

import { useCallback, useEffect, useState } from 'react';

import { MO_POLL_INTERVAL_MS, MO_VALID_SECONDS } from '@/features/join/data/mo';
import { buildSmsHref, createMoCode } from '@/features/join/lib/moSchema';

export type MoStatus = 'idle' | 'waiting' | 'verified' | 'expired' | 'error';

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
 * 인증 코드는 화면에서 만든다 - 사용자가 그 코드를 문자로 보내면 서버가 수신을
 * 확인해 판정하므로, 코드 자체는 비밀이 아니고 서버가 미리 알고 있을 필요도 없다.
 * 덕분에 문자 보내기 경로는 API 를 한 번도 부르지 않고 시작한다.
 * QR 은 PC 처럼 문자 앱이 없는 경우를 위한 보조 수단이라 필요할 때만 발급받는다.
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
  const [secondsLeft, setSecondsLeft] = useState(MO_VALID_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  const isCurrentNumber = targetNum === mobileNum;
  const isPolling = isCurrentNumber && status === 'waiting';

  // 2. 부수 효과 - 남은 시간과 수신 조회를 같이 돌린다
  useEffect(() => {
    if (!isPolling) return;

    const controller = new AbortController();
    const startedAt = Date.now();

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
  }, [isPolling, mobileNum, code]);

  // 3. 동작
  /**
   * 인증 대기를 시작한다. 끝난 판(완료·만료·오류)에서 다시 부르면 코드를 새로
   * 만든다 - 지난 코드 그대로면 아까 보낸 문자가 다시 잡혀 통과해버린다.
   */
  const start = useCallback(() => {
    const isFinished =
      !isCurrentNumber ||
      status === 'verified' ||
      status === 'expired' ||
      status === 'error';

    if (isFinished) {
      setCode(createMoCode());
      setQrCode(null);
    }

    setTargetNum(mobileNum);
    setErrorMessage(null);
    setSecondsLeft(MO_VALID_SECONDS);
    setStatus('waiting');
  }, [isCurrentNumber, mobileNum, status]);

  /** PC 처럼 문자 앱이 없는 경우를 위한 QR - 처음 열 때만 발급받는다 */
  const loadQrCode = useCallback(async () => {
    if (qrCode !== null || isQrLoading) return;

    setIsQrLoading(true);

    try {
      const response = await fetch('/api/join/mo/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setErrorMessage(await readErrorMessage(response));
        return;
      }

      const body = (await response.json()) as { qrCode?: unknown };

      if (typeof body.qrCode !== 'string') {
        setErrorMessage('QR 코드를 받지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      setQrCode(body.qrCode);
    } catch {
      setErrorMessage('QR 코드를 받지 못했습니다. 네트워크를 확인해 주세요.');
    } finally {
      setIsQrLoading(false);
    }
  }, [code, isQrLoading, qrCode]);

  return {
    /** 지금 입력된 번호 기준의 상태 - 번호를 고치면 처음 상태로 돌아간다 */
    status: isCurrentNumber ? status : ('idle' as MoStatus),
    isVerified: isCurrentNumber && status === 'verified',
    code,
    /** 누르면 수신번호와 본문이 채워진 채로 문자 앱이 열린다 */
    smsHref: buildSmsHref(code),
    secondsLeft,
    errorMessage: isCurrentNumber ? errorMessage : null,
    qrCode,
    isQrLoading,
    start,
    loadQrCode,
  };
}
