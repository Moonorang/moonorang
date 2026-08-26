// 가격에 쉼표 달아주는 유틸 함수
export function formatWon(amount: number): string {
  return amount.toLocaleString('ko-KR');
}
