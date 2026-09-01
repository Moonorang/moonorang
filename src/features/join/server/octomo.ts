/**
 * CARD-037: MO(Mobile Originated) 본인 인증 - OCTOMO API 연동.
 *
 * 사용자가 옥토모 대표번호로 문자를 보내면 그 수신 여부를 조회하는 방식이라,
 * 우리 서버가 문자를 직접 받을 필요가 없다(웹훅용 공인 도메인이 필요 없어
 * 로컬 개발에서도 실제로 인증된다).
 *
 * API 키는 이 파일에서만 읽는다 - 화면에서 OCTOMO 를 직접 부르면 키가 브라우저에
 * 노출되므로(NFR-008) 반드시 라우트 핸들러를 거친다.
 */
import { MO_WITHIN_MINUTES } from '@/features/join/data/mo';

const OCTOMO_BASE_URL = 'https://api.octoverse.kr/octomo/v1/public/message';

/** 응답이 늦어도 화면이 계속 매달려 있지 않도록 */
const REQUEST_TIMEOUT_MS = 10_000;

export interface OctomoFailure {
  /** 우리 API 가 그대로 내보낼 HTTP 상태 */
  status: number;
  /** NFR-011: 사유와 다음 행동을 담은 사용자용 문구 */
  message: string;
}

export type OctomoResult<T> =
  ({ ok: true } & T) | { ok: false; failure: OctomoFailure };

function buildHeaders(): HeadersInit | null {
  const apiKey = process.env.OCTOMO_API_KEY;
  if (!apiKey) return null;

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Octomo ${apiKey}`,
  };
}

/**
 * OCTOMO 의 실패를 사용자에게 보여줄 문구로 옮긴다.
 * 401·403·404 는 우리 키/구독 문제라 사용자가 할 수 있는 게 없으므로 502 로 묶는다.
 */
function toFailure(status: number): OctomoFailure {
  if (status === 429) {
    return {
      status: 429,
      message: '인증 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (status === 400) {
    return {
      status: 400,
      message: '인증 요청 값이 올바르지 않습니다. 휴대폰 번호를 확인해 주세요.',
    };
  }

  return {
    status: 502,
    message: '인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };
}

async function requestOctomo(
  path: string,
  body: Record<string, unknown>,
): Promise<OctomoResult<{ data: unknown }>> {
  const headers = buildHeaders();

  if (!headers) {
    console.error('[octomo] OCTOMO_API_KEY 가 설정되지 않았습니다');

    return {
      ok: false,
      failure: {
        status: 500,
        message: '본인 인증을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      },
    };
  }

  try {
    const response = await fetch(`${OCTOMO_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('[octomo] 요청 실패:', path, response.status);

      return { ok: false, failure: toFailure(response.status) };
    }

    return { ok: true, data: await response.json() };
  } catch (error) {
    // 네트워크 단절·타임아웃 - 상태 코드가 없어 502 로 묶는다
    console.error('[octomo] 요청 중 오류:', path, error);

    return { ok: false, failure: toFailure(0) };
  }
}

/**
 * 인증 코드를 담은 QR 코드를 발급한다.
 * 응답의 qrCode 는 PNG data URL 이라 <img src={qrCode}> 로 바로 그릴 수 있다.
 */
export async function issueMoQrCode(
  code: string,
): Promise<OctomoResult<{ qrCode: string }>> {
  // text 만 보내면 오류 정정 수준·여백·크기는 문서의 기본값(M/2/200)으로 동작한다
  const result = await requestOctomo('/qr-code', { text: code });
  if (!result.ok) return result;

  const qrCode = (result.data as { qrCode?: unknown }).qrCode;

  if (typeof qrCode !== 'string') {
    console.error('[octomo] qrCode 필드가 없습니다:', result.data);

    return { ok: false, failure: toFailure(0) };
  }

  return { ok: true, qrCode };
}

/** 그 번호에서 그 코드가 담긴 문자가 실제로 왔는지 확인한다 */
export async function existsMoMessage(
  mobileNum: string,
  code: string,
): Promise<OctomoResult<{ exists: boolean }>> {
  const result = await requestOctomo('/exists', {
    mobileNum,
    text: code,
    withinMinutes: MO_WITHIN_MINUTES,
  });
  if (!result.ok) return result;

  return {
    ok: true,
    exists: (result.data as { exists?: unknown }).exists === true,
  };
}
