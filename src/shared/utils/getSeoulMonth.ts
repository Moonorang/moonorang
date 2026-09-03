/** 이용 요금이 어느 달 것인지 - 서버가 어느 지역에 있든, 브라우저가 어느 지역이든
 * 한국 기준으로 센다. mypage(서버)와 채팅 사용량 분석(서버) 양쪽에서 같이 쓴다. */
export function getSeoulMonth(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
    }).format(new Date()),
  );
}
