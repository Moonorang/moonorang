import type { Gender } from '@/entities/user/types';

/**
 * CARD-046: 가입 절차 도중 화면을 떠났다 돌아왔을 때 이어가기 위한 진행 상태.
 * features/join 이 만들고 features/chat 이 대화와 함께 저장한다 - 두 feature 가
 * 함께 쓰는 개념이라 여기 둔다.
 *
 * 이름·카드번호는 절대 담지 않는다. 절차를 어디까지 밟았는지만 남기고 값 자체는
 * 화면 안에서만 살다가 사라진다 (features/join 의 CardStep 주석과 같은 이유).
 * gender·birth 만 예외인데, 주민등록번호에서 뽑아낸 결과값이라 원본(뒷자리)을
 * 되살릴 수 없고, 가입을 마칠 때 회원 정보에 남겨야 하기 때문이다.
 */
export interface PlanJoinProgress {
  /** 어느 단계까지 왔는지 (JOIN_STEPS 의 인덱스) */
  stepIndex: number;
  /** 동의를 마친 약관 id */
  agreedTermIds: string[];
  /** 본인 확인에서 갈라낸 성별. 아직 본인 확인 전이면 없다 */
  gender?: Gender;
  /** 본인 확인에서 뽑아낸 생년월일 (YYYY-MM-DD). 아직 본인 확인 전이면 없다 */
  birth?: string;
}
