import { formatWon } from '@/shared/utils/formatCurrency';

// 월 단위로 결제되는 값(부가서비스·구독 상품 등)의 표기. 0원은 금액 대신 '무료'로 보여준다.
export function formatMonthlyFee(fee: number): string {
  return fee === 0 ? '무료' : `월 ${formatWon(fee)} 원`;
}
