// subscriptions.discount 는 스키마 할인율(%)
export function getDiscountedFee(
  baseFee: number,
  discount: number,
): { fee: number; label?: string } {
  if (discount <= 0) return { fee: baseFee };

  return {
    fee: Math.round(baseFee * (1 - discount / 100)),
    label: `${discount}% 할인`,
  };
}
