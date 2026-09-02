const SIGNUP_PREFILL_KEY = 'moonorang:signup-prefill:v1';

/**
 * AUTH-008: 요금제 가입 도중 회원가입으로 넘어갈 때, 추가 정보 화면이 초기값으로
 * 쓰라고 건네는 값. features/join 이 남기고 features/auth 가 읽는다.
 */
export interface SignupPrefill {
  /** 본인 확인에서 받은 이름 */
  name: string;
  /** 하이픈 없는 휴대폰 번호 11자리 - 표시 형식은 읽는 쪽이 맞춘다 */
  mobileNum: string;
}

/*
 * localStorage 가 아니라 sessionStorage 를 쓰는 이유:
 * 이 값은 '카카오를 다녀오는 한 번의 여정' 동안만 필요하고, 탭을 닫으면 같이
 * 사라져야 한다. 주민등록번호·카드번호는 여기에도 담지 않는다 - 회원가입 화면이
 * 실제로 받는 항목(이름·연락처)만 넘긴다.
 *
 * 저장이 막혀 있어도(프라이빗 모드 등) 조용히 넘어간다. 초기값이 안 채워질 뿐
 * 회원가입 자체는 그대로 할 수 있어야 한다.
 */

export function saveSignupPrefill(prefill: SignupPrefill): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(SIGNUP_PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    // 저장 실패 - 초기값만 못 채울 뿐 회원가입엔 지장 없음
  }
}

export function loadSignupPrefill(): SignupPrefill | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(SIGNUP_PREFILL_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SignupPrefill> | null;
    if (typeof parsed?.name !== 'string') return null;

    return {
      name: parsed.name,
      mobileNum: typeof parsed.mobileNum === 'string' ? parsed.mobileNum : '',
    };
  } catch {
    return null;
  }
}

/** 다 쓴 값은 지운다 - 회원 정보에 들어간 뒤로는 브라우저에 남을 이유가 없다 */
export function clearSignupPrefill(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(SIGNUP_PREFILL_KEY);
  } catch {
    // 무시
  }
}
