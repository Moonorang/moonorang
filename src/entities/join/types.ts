import type { Gender } from '@/entities/user/types';

/**
 * 가입 절차를 붙일 수 있는 상품 종류.
 * 요금제만 있던 것을 부가서비스·구독까지 넓히면서, 카드 한 장이 무엇에 대한
 * 절차인지를 이 값으로 가른다.
 */
export type JoinKind = 'plan' | 'addOn' | 'subscription';

/**
 * 가입 카드 한 장이 가리키는 상품.
 *
 * kind 없이 id 만으로는 카드를 특정할 수 없다 - plans.id 와 add_ons.id 는 서로
 * 다른 표의 번호라 3번 요금제와 3번 부가서비스가 같은 번호를 갖는다.
 */
export interface JoinTarget {
  kind: JoinKind;
  itemId: number;
}

/**
 * CARD-046: 가입 절차 도중 화면을 떠났다 돌아왔을 때 이어가기 위한 진행 상태.
 * features/join 이 만들고 features/chat 이 대화와 함께 저장한다 - 두 feature 가
 * 함께 쓰는 개념이라 여기 둔다.
 *
 * 이름·카드번호는 절대 담지 않는다. 절차를 어디까지 밟았는지만 남기고 값 자체는
 * 화면 안에서만 살다가 사라진다 (features/join 의 CardStep 주석과 같은 이유).
 * gender·birth 만 예외인데, 주민등록번호에서 뽑아낸 결과값이라 원본(뒷자리)을
 * 되살릴 수 없고, 가입을 마칠 때 회원 정보에 남겨야 하기 때문이다.
 * 본인 확인이 없는 종류(부가서비스)에서는 이 둘이 늘 비어 있다.
 */
export interface JoinProgress {
  /** 어느 단계까지 왔는지 (그 종류의 단계 목록에서의 인덱스) */
  stepIndex: number;
  /** 동의를 마친 약관 id */
  agreedTermIds: string[];
  /** 본인 확인에서 갈라낸 성별. 아직 본인 확인 전이면 없다 */
  gender?: Gender;
  /** 본인 확인에서 뽑아낸 생년월일 (YYYY-MM-DD). 아직 본인 확인 전이면 없다 */
  birth?: string;
}
