// 부가서비스·구독 상품 추천이 공유하는 정렬 규칙. 도메인 타입을 모르게 두고
// "검색용 텍스트"와 "인기도 점수"만 받는다.

function isInterestMatch(searchableText: string, interests: string[]): boolean {
  const normalized = searchableText.toLowerCase();
  return interests.some((interest) => {
    const trimmed = interest.trim().toLowerCase();
    return trimmed.length > 0 && normalized.includes(trimmed);
  });
}

/**
 * 관심사에 맞는 항목을 목록 맨 위로 올리되, 안 맞는 항목도 걸러내지 않고 뒤에
 * 그대로 이어붙인다 - 관심사가 좁아서 매칭이 적어도 카드가 휑하게 비지 않는다.
 * 같은 그룹(매치/비매치) 안에서는 인기도(getRate) 내림차순으로 다시 정렬한다.
 * 같은 입력엔 항상 같은 순서가 나온다(NFR-005) - 정렬 축이 전부 결정론적이다.
 */
export function rankByInterestThenRate<T>(
  items: T[],
  interests: string[] | undefined,
  getSearchableText: (item: T) => string,
  getRate: (item: T) => number,
  max: number,
): T[] {
  const hasInterests = Boolean(interests?.length);
  const isMatch = (item: T) =>
    hasInterests && isInterestMatch(getSearchableText(item), interests ?? []);

  return items
    .slice()
    .sort((a, b) => {
      const matchDiff = Number(isMatch(b)) - Number(isMatch(a));
      if (matchDiff !== 0) return matchDiff;
      return getRate(b) - getRate(a);
    })
    .slice(0, max);
}
