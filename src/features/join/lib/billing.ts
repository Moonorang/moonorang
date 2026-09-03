/**
 * DATA-017: 구독 상품은 매 달 같은 일에 결제된다 - 신청일 기준 한 달 뒤 같은 날.
 *
 * 31일에 신청한 경우처럼 다음 달에 그 날짜가 없으면 그 달의 마지막 날로 당긴다.
 * 그냥 두면 자바스크립트가 다음다음 달로 넘겨버려서(2월 31일 → 3월 3일) 결제일이
 * 한 달씩 밀린다.
 */
export function getNextBillingDate(from: Date): Date {
  const year = from.getFullYear();
  const month = from.getMonth();

  // 다음다음 달 0일 = 다음 달 말일
  const lastDayOfNextMonth = new Date(year, month + 2, 0).getDate();

  return new Date(
    year,
    month + 1,
    Math.min(from.getDate(), lastDayOfNextMonth),
  );
}

/**
 * date 컬럼에 넣을 YYYY-MM-DD.
 *
 * toISOString 을 쓰지 않는 이유는 그쪽이 UTC 로 옮겨 적어서, 우리 시간대에서는
 * 자정 근처의 날짜가 하루 어긋나기 때문이다.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}
