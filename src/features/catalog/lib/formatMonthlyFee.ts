import { formatWon } from '@/shared/utils/formatCurrency';

// 목록 카드의 월 요금 표기. 0원은 금액 대신 '무료'로 보여준다.
export function formatMonthlyFee(fee: number): string {
  return fee === 0 ? '무료' : `월 ${formatWon(fee)} 원`;
}
