// "OTT"/"스트리밍"처럼 카테고리로만 말했을 때, rankByInterestThenRate의 단순 부분
// 문자열 매칭만으로는 아무것도 못 찾는다 - "OTT"라는 글자 자체가 실제 상품명·설명
// 어디에도 없기 때문이다. 그래서 카테고리 키워드가 들어오면 실제 텍스트에 있을 법한
// 구체적인 영상 OTT 브랜드명으로 풀어서 같이 매칭한다.
//
// plans.ts의 GENERIC_MEDIA_INTEREST_KEYWORDS와 달리 "필드가 있으면 다 매치"로는
// 못 가린다 - 부가서비스·구독 상품은 이름에 서로 무관한 상품이 같이 묶여 있어서
// (예: "라프텔 + 요기요", "지니뮤직 + CU 편의점") 브랜드명을 직접 나열해야 한다.
const OTT_CATEGORY_KEYWORDS = new Set(['ott', 'ott서비스', 'ott 서비스', '오티티', '스트리밍', '영상']);

const OTT_BRAND_SYNONYMS = [
  '넷플릭스',
  '유튜브',
  '웨이브',
  'wavve',
  '티빙',
  'tving',
  '디즈니',
  'disney',
  '쿠팡플레이',
  '라프텔',
  '왓챠',
  'watcha',
];

/**
 * interests에 OTT 카테고리 키워드가 있으면 구체적인 브랜드명들을 더해서 돌려준다
 * (매칭용으로만 확장 - chats.keywords에 실제로 저장되는 값은 그대로 둔다). 카테고리
 * 키워드가 없으면 원본을 그대로 돌려준다.
 */
export function expandOttInterests(
  interests: string[] | undefined,
): string[] | undefined {
  if (!interests?.length) return interests;

  const hasOttCategory = interests.some((interest) =>
    OTT_CATEGORY_KEYWORDS.has(interest.trim().toLowerCase()),
  );
  if (!hasOttCategory) return interests;

  return [...new Set([...interests, ...OTT_BRAND_SYNONYMS])];
}
