'use client';

import { useCallback, useEffect, useState } from 'react';

import { MO_POLL_INTERVAL_MS, MO_VALID_SECONDS } from '@/features/join/data/mo';
import { createMoCode } from '@/features/join/lib/moSchema';

export type MoStatus =
  'idle' | 'issuing' | 'waiting' | 'verified' | 'expired' | 'error';

/** 발급받은 코드 한 벌 - 어느 번호로 발급했는지 같이 들고 있어야 한다 */
interface MoSession {
  mobileNum: string;
  code: string;
  qrCode: string;
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
 * 인증 코드를 담은 QR 을 발급받아 화면에 띄우고, 사용자가 폰으로 스캔해 문자를
 * 보내면 그 수신 여부를 주기적으로 조회한다. 판정은 서버(OCTOMO)가 하므로
 * 화면에서 통과시킬 방법이 없다.
 *
 * 번호를 고치면 이전 인증은 무효다. 상태를 지우는 대신 "어느 번호로 발급했는지"를
 * 같이 들고 있다가 지금 번호와 다르면 처음 상태로 보여준다 - 그래야 번호를
 * 되돌렸을 때 진행 중이던 인증이 그대로 살아난다.
 */
export function useMoVerification(mobileNum: string) {
  // 1. 상태
  const [session, setSession] = useState<MoSession | null>(null);
  const [requestedFor, setRequestedFor] = useState<string | null>(null);
  const [status, setStatus] = useState<MoStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(MO_VALID_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCurrentNumber = requestedFor === mobileNum;
  const isPolling = isCurrentNumber && status === 'waiting' && session !== null;

  // 2. 부수 효과 - 남은 시간과 수신 조회를 같이 돌린다
  useEffect(() => {
    if (!isPolling || !session) return;

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
          body: JSON.stringify({
            mobileNum: session.mobileNum,
            code: session.code,
          }),
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
  }, [isPolling, session]);

  // 3. 동작
  /** 인증 코드를 새로 발급받아 대기를 시작한다 */
  const start = useCallback(async () => {
    const code = createMoCode();

    setRequestedFor(mobileNum);
    setSession(null);
    setErrorMessage(null);
    setStatus('issuing');

    try {
      const response = await fetch('/api/join/mo/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setErrorMessage(await readErrorMessage(response));
        setStatus('error');
        return;
      }

      const body = (await response.json()) as { qrCode?: unknown };

      if (typeof body.qrCode !== 'string') {
        setErrorMessage(
          '인증용 QR 코드를 받지 못했습니다. 다시 시도해 주세요.',
        );
        setStatus('error');
        return;
      }

      setSession({ mobileNum, code, qrCode: body.qrCode });
      setSecondsLeft(MO_VALID_SECONDS);
      setStatus('waiting');
    } catch {
      setErrorMessage(
        '인증 요청을 보내지 못했습니다. 네트워크를 확인해 주세요.',
      );
      setStatus('error');
    }
  }, [mobileNum]);

  return {
    /** 지금 입력된 번호 기준의 상태 - 번호를 고치면 처음 상태로 돌아간다 */
    status: isCurrentNumber ? status : ('idle' as MoStatus),
    isVerified: isCurrentNumber && status === 'verified',
    qrCode: isCurrentNumber ? (session?.qrCode ?? null) : null,
    code: isCurrentNumber ? (session?.code ?? null) : null,
    secondsLeft,
    errorMessage: isCurrentNumber ? errorMessage : null,
    start,
  };
}
