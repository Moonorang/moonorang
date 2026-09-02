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
