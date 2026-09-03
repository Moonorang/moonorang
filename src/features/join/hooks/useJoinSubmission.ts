'use client';

import { useEffect, useRef, useState } from 'react';

import { PAYMENT_DELAY_MS } from '@/features/join/data/complete';

import {
  clearPendingJoinPayment,
  hasPendingJoinPayment,
  savePendingJoinPayment,
} from '@/entities/join';
import type { JoinTarget } from '@/entities/join/types';

interface UseJoinSubmissionParams {
  /** 어느 상품에 대한 절차인지 - 회원가입을 다녀오는 동안 표식으로 남는다 */
  target: JoinTarget;
  /** CARD-044: 확정은 회원만 할 수 있다. 아직 확인 중이면 undefined */
  isLoggedIn?: boolean;
  /** 이미 마친 절차인지 - 두 번 확정되지 않게 막는 기준 */
  isCompleted: boolean;
  /** 실제로 확정하는 서버 액션 호출 */
  onSubmit: () => Promise<{ errorMessage?: string }>;
  /**
   * AUTH-008: 비회원이 회원가입으로 빠지기 직전에 할 일.
   * 요금제 가입만 쓴다 - 본인 확인에서 받은 값을 추가 정보 화면에 넘겨준다.
   */
  onBeforeSignup?: () => void;
  /** 확정이 끝난 순간 한 번 불린다 */
  onComplete?: () => void;
  /** COMMON-002: 서버 액션이 예외로 튀었을 때 보여줄 사유 */
  errorFallbackMessage: string;
}

/**
 * CARD-043/044: 가입 절차의 마지막 - 확정 버튼을 누른 뒤의 상태 기계.
 *
 * 요금제·부가서비스·구독 카드가 마지막 단계에서 똑같이 겪는 일을 한자리에 모았다.
 * 세 카드가 다른 것은 "무엇을 확정하는가"(onSubmit) 하나뿐이고, 그 앞뒤로 일어나는
 * 일 - 처리 중 표시, 비회원을 회원가입으로 보내기, 돌아와서 이어가기, 실패 사유
 * 보여주기 - 은 전부 같다.
 *
 * 이걸 카드마다 따로 두면 여기서 고친 것이 저기에는 안 고쳐진다. 실제로 '처리 중
 * 화면에 갇히는' 버그를 요금제에서 고친 뒤 부가서비스 카드에 손으로 옮겨 적어야
 * 했는데, 그 일이 다시 생기지 않게 하려는 것이 이 훅의 목적이다.
 */
export function useJoinSubmission({
  target,
  isLoggedIn,
  isCompleted,
  onSubmit,
  onBeforeSignup,
  onComplete,
  errorFallbackMessage,
}: UseJoinSubmissionParams) {
  // 1. 상태
  // 확정 버튼을 누른 뒤 결과가 대화에 나오기 전까지의 처리 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // CARD-044: 비회원이 확정을 눌러 회원가입 안내로 갈아탄 상태
  const [isSignupRequired, setIsSignupRequired] = useState(false);
  // COMMON-002: 저장하지 못했을 때 마지막 화면에 남기는 사유
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 회원가입을 마치고 돌아와 이어간 적이 있는지 - 한 번만 이어간다
  const hasResumedRef = useRef(false);

  // 2. 이벤트 핸들러
  /** 처리 시간이 흐른 뒤 - 실제로 확정하고 결과를 대화로 넘긴다 */
  const finish = async () => {
    // 서버 액션이 아예 실패(네트워크 끊김 등)하면 예외로 튀는데, 그대로 두면
    // 처리 중 화면에 갇힌다. 사유를 보여주고 마지막 화면으로 되돌린다.
    const { errorMessage: failure } = await onSubmit().catch(
      (error: unknown) => {
        console.error('[join] 가입 확정 처리 실패', error);

        return { errorMessage: errorFallbackMessage };
      },
    );

    setIsSubmitting(false);

    if (failure) {
      setErrorMessage(failure);
      return;
    }

    // 회원가입을 거쳐 이어온 절차라면 그 표식을 여기서 거둔다 - 실제로 끝난 시점이 여기다
    clearPendingJoinPayment();

    onComplete?.();
  };

  /**
   * 확정 버튼. 실제 결제 연동이 없어서 잠깐 처리하는 척하다가, 끝나면 결과를
   * 카드가 아니라 대화에 새 메시지로 넘긴다 - 절차가 끝난 뒤의 이야기는 단계의
   * 하나가 아니라 무너가 건네는 다음 말이기 때문이다.
   */
  const submit = () => {
    if (isSubmitting || isCompleted) return;
    // 로그인 여부를 아직 모르는 동안에는 아무 쪽으로도 가지 않는다 - 회원인데
    // 확인이 안 끝났다는 이유로 회원가입 안내를 띄우면 안 된다
    if (isLoggedIn === undefined) return;

    setErrorMessage(null);

    // CARD-044: 확정은 회원만 할 수 있어서, 비회원은 회원가입부터 거친다.
    if (!isLoggedIn) {
      onBeforeSignup?.();
      // 회원이 되어 돌아오면 이 카드가 절차를 이어서 끝낸다.
      // 최종 확인은 방금 이 누름으로 이미 받았으므로 또 묻지 않는다.
      savePendingJoinPayment(target);
      setIsSignupRequired(true);
      return;
    }

    setIsSubmitting(true);
  };

  /** 회원가입 안내에서 되돌아가기 - 확정은 물리지 않고 안내만 접는다 */
  const closeSignupNotice = () => {
    setIsSignupRequired(false);
  };

  /**
   * 이전 단계로 물러날 때. 확정을 물렀다는 뜻이므로 표식까지 거둔다 -
   * 안 거두면 회원가입을 다녀왔을 때 저절로 확정된다.
   */
  const withdraw = () => {
    setIsSignupRequired(false);
    clearPendingJoinPayment();
  };

  // 3. 부수 효과
  /*
   * 처리 시간을 흉내내는 타이머. 핸들러 안에서 setTimeout 을 걸지 않고 이 효과가
   * 갖고 있는 이유는, 그래야 화면이 다시 붙어도 타이머가 같이 되살아나기 때문이다 -
   * 카드는 처리 도중에도 다시 그려질 수 있고(개발 모드의 효과 이중 실행, 대화
   * 승계로 카드가 붙는 자리가 바뀌는 경우), 핸들러가 건 타이머는 그때 정리만 되고
   * 다시 걸리지 않아 '처리 중' 화면에 갇힌다. isSubmitting 이 참인 동안 타이머가
   * 있어야 한다는 사실을 상태로 표현하면 그 갇힘이 생기지 않는다.
   */
  useEffect(() => {
    if (!isSubmitting) return;

    const timer = setTimeout(() => void finish(), PAYMENT_DELAY_MS);

    // 처리 중에 카드가 사라지면(대화 초기화 등) 없는 화면을 바꾸려 드는 걸 막는다
    return () => clearTimeout(timer);
    // finish 는 매 렌더 새로 만들어져서 넣으면 타이머가 계속 다시 걸린다.
    // 이 효과가 봐야 하는 것은 '처리 중인가' 하나뿐이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting]);

  /*
   * CARD-044: 카카오 회원가입을 마치고 돌아온 경우, 남겨둔 표식을 보고 절차를
   * 이어서 끝낸다. 사용자는 회원가입 전에 이미 확정을 눌렀으므로 같은 버튼을
   * 또 누르게 하지 않는다.
   *
   * isLoggedIn 이 참이 된 뒤에야 확인한다 - 로그인 여부를 확인하는 동안에는
   * 거짓이라, 그때 실행하면 회원가입 안내로 되돌아가 버린다.
   */
  useEffect(() => {
    if (!isLoggedIn || isCompleted || isSubmitting) return;
    if (hasResumedRef.current) return;
    if (!hasPendingJoinPayment(target)) return;

    hasResumedRef.current = true;

    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       sessionStorage(외부 저장소)에 남은 표식을 읽어와 그때 시작하는 동작이라,
       이 규칙이 막으려는 "반복 렌더로 이어지는 setState"가 아니다. 표식은 절차를
       마칠 때 거둬지고 ref 로도 한 번 더 잠가서 거듭 실행되지 않는다. */
    submit();
  });

  return {
    isSubmitting,
    isSignupRequired,
    errorMessage,
    submit,
    closeSignupNotice,
    withdraw,
  };
}
