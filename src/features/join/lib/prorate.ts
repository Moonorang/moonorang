/**
 * DATA-012: 부가서비스는 이용한 기간만큼만 비용이 청구된다.
 *
 * 신청일부터 그 달 말일까지의 일수를 그 달 전체 일수로 나눠 월 기준 금액에 곱한다.
 * 신청일 당일도 이용한 날로 세므로, 1일에 신청하면 한 달치가 그대로 나온다.
 *
 * 원 단위 아래는 버린다 - 청구서에 소수점이 찍히면 안 되고, 올림이면 실제 이용
 * 기간보다 많이 받는 모양이 되기 때문이다.
 */
export function getProratedFee(
  baseMonthlyRate: number,
  startedAt: Date,
): number {
  const { daysInMonth, remainingDays } = getProrationPeriod(startedAt);

  return Math.floor((baseMonthlyRate * remainingDays) / daysInMonth);
}

export interface ProrationPeriod {
  /** 그 달의 총 일수 */
  daysInMonth: number;
  /** 신청일부터 말일까지, 신청일 당일을 포함한 일수 */
  remainingDays: number;
  /** 청구 대상 마지막 날 (그 달 말일) */
  lastDate: Date;
}

/** 일할 계산의 근거가 되는 기간 - 화면에 "9/3~9/30, 28일"처럼 함께 보여준다 */
export function getProrationPeriod(startedAt: Date): ProrationPeriod {
  const year = startedAt.getFullYear();
  const month = startedAt.getMonth();

  // 다음 달 0일 = 이번 달 말일
  const lastDate = new Date(year, month + 1, 0);
  const daysInMonth = lastDate.getDate();
  const remainingDays = daysInMonth - startedAt.getDate() + 1;

  return { daysInMonth, remainingDays, lastDate };
}
