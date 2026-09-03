interface SubscriptionJoinResultMessageParams {
  /** 신청한 구독 상품 이름 */
  subscriptionName: string;
  /** 로그인한 고객의 이름. 모르면 이름 없이 '고객님'으로만 부른다 */
  customerName?: string;
}

interface AddOnJoinResultMessageParams {
  /** 신청한 부가서비스 이름 */
  addOnName: string;
  /** 로그인한 고객의 이름. 모르면 이름 없이 '고객님'으로만 부른다 */
  customerName?: string;
}

interface JoinResultMessageParams {
  /** 가입한 요금제 이름 */
  planName: string;
  /** 로그인한 고객의 이름. 모르면 이름 없이 '고객님'으로만 부른다 */
  customerName?: string;
}

/**
 * CARD-043: 가입이 끝난 뒤 대화에 남기는 안내 문구.
 * 매번 같은 말이어야 하고 대화 문맥도 아니라서 모델을 거치지 않고 여기서 만든다 -
 * ChatRoom 의 PLAN_JOIN_GUIDE 와 같은 이유다.
 *
 * 요금제 이름은 [[ ]] 로 감싸 눈에 띄게 한다 (FormattedMessage 가 색을 입힌다).
 */
export function buildJoinResultMessage({
  planName,
  customerName,
}: JoinResultMessageParams): string {
  const caller = customerName ? `${customerName} 고객님은` : '고객님은';

  return `${caller} [[${planName} 요금제]]를 가입하셨어요.`;
}

/**
 * DATA-010: 부가서비스 신청이 끝난 뒤 대화에 남기는 안내 문구.
 * buildJoinResultMessage 와 같은 이유로 모델을 거치지 않고 여기서 만든다.
 */
export function buildAddOnJoinResultMessage({
  addOnName,
  customerName,
}: AddOnJoinResultMessageParams): string {
  const caller = customerName ? `${customerName} 고객님은` : '고객님은';

  return `${caller} [[${addOnName}]] 부가서비스를 신청하셨어요.`;
}

/**
 * DATA-015: 구독 신청이 끝난 뒤 대화에 남기는 안내 문구.
 * buildJoinResultMessage 와 같은 이유로 모델을 거치지 않고 여기서 만든다.
 */
export function buildSubscriptionJoinResultMessage({
  subscriptionName,
  customerName,
}: SubscriptionJoinResultMessageParams): string {
  const caller = customerName ? `${customerName} 고객님은` : '고객님은';

  return `${caller} [[${subscriptionName}]] 구독을 시작하셨어요.`;
}
