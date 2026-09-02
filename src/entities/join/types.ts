import type { Plan } from '@/entities/plan/types';
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
 * 가입 절차를 걸 상품 하나. 종류마다 담기는 값이 달라 kind 로 가르는 판별 유니온이다.
 *
 * JoinTarget 이 "어느 상품인지"만 가리키는 데 비해 이쪽은 카드를 그리는 데 필요한
 * 값을 통째로 들고 있다 - 목록 상세에서 채팅으로 넘어올 때처럼, 받는 쪽이 다시
 * 조회하지 않고 곧바로 카드를 띄울 수 있어야 하는 자리가 있어서다.
 *
 * 종류가 늘면 여기에 갈래를 하나 더한다 - 그러면 이 값을 다루는 곳들이 컴파일
 * 오류로 한 번에 드러난다.
 */
export type JoinItem = { kind: 'plan'; item: Plan };

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
