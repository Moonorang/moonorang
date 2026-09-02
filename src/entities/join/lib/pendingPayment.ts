import { getJoinKey } from '@/entities/join/lib/joinKey';
import type { JoinTarget } from '@/entities/join/types';

const PENDING_JOIN_PAYMENT_KEY = 'moonorang:pendingJoinPayment';

/*
 * CARD-044: 비회원이 결제하기를 눌러 카카오 회원가입으로 빠질 때 남기는 표식.
 * 회원이 되어 돌아오면 가입 카드가 이 표식을 보고 결제를 이어서 끝낸다 - 사용자는
 * 이미 최종 확인에서 결제하기를 눌렀으므로, 돌아와서 같은 버튼을 또 누르게 하지
 * 않는다(CARD-043 의 "최종 확인 이후에만 확정"은 그 누름으로 이미 충족된다).
 *
 * features/join 이 남기고 features/join 이 읽지만, 카카오를 다녀오며 화면이 통째로
 * 새로 뜨는 사이를 건너야 해서 컴포넌트 상태로는 이을 수 없다.
 *
 * sessionStorage 인 이유는 entities/user 의 signupPrefill 과 같다 - '카카오를
 * 다녀오는 한 번의 여정' 동안만 필요하고 탭을 닫으면 같이 사라져야 한다.
 * 쿼리 파라미터로 넘기지 않는 이유도 같다 - URL 에 남으면 새로고침할 때마다
 * 결제가 다시 일어난다.
 */

export function savePendingJoinPayment(target: JoinTarget): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(PENDING_JOIN_PAYMENT_KEY, getJoinKey(target));
  } catch {
    // 저장 실패 - 돌아왔을 때 결제하기를 한 번 더 눌러야 할 뿐, 절차는 그대로다
  }
}

/**
 * 이 상품에 대한 표식이 남아 있는지 본다. 읽기만 하고 지우지는 않는다.
 *
 * 다른 상품의 표식은 false 를 준다 - 대화에 가입 카드가 여러 장 떠 있을 때,
 * 엉뚱한 카드가 남의 결제를 대신 끝내지 않게 하기 위함이다.
 *
 * 읽으면서 지우지 않는 이유: 카드는 결제 도중에도 다시 그려지거나 아예 새로 붙을
 * 수 있는데(대화 승계로 붙는 자리가 바뀌는 경우), 그때 표식이 이미 지워져 있으면
 * 결제가 시작된 적도 끝난 적도 없는 채로 멈춘다. 표식은 결제가 실제로 끝났을 때
 * (clearPendingJoinPayment) 거둔다.
 */
export function hasPendingJoinPayment(target: JoinTarget): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return (
      window.sessionStorage.getItem(PENDING_JOIN_PAYMENT_KEY) ===
      getJoinKey(target)
    );
  } catch {
    return false;
  }
}

/** 결제를 마쳤거나 이어가지 않기로 한 경우(이전 단계로 돌아가는 등) 표식을 거둔다 */
export function clearPendingJoinPayment(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(PENDING_JOIN_PAYMENT_KEY);
  } catch {
    // 무시
  }
}
