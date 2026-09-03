import type { BenefitIcon, LeisureTypeId } from '@/features/test/types';

/** 유형마다 어디서 요금제와 혜택을 끌어올지 */
export interface TypeBenefitSource {
  /**
   * 요금제를 고를 때 쓰는 낱말. 요금제 이름·설명·혜택 값 전체에서 찾아,
   * 많이 걸리는 요금제를 첫 줄에 세운다.
   */
  planKeywords: string[];
  /**
   * 고른 요금제에서 어떤 혜택을 대표로 적을지 (plans.benefits 의 키).
   * 앞에 적은 것부터 찾아 요금제가 실제로 가진 첫 번째를 쓴다.
   */
  planBenefitKeys: string[];
  /** membership_brands.category 값. 앞에 적은 것부터 찾는다 */
  membershipCategories: string[];
  /** add_ons.title 에 들어 있는 낱말. 앞에 적은 것부터 찾는다 */
  addOnKeywords: string[];
  /**
   * 세 줄에 위에서부터 하나씩 붙일 아이콘.
   * 같은 아이콘이 두 줄에 겹치면 세 줄이 한 덩어리로 보여서, 줄마다 다른 것을 쓴다.
   */
  icons: [BenefitIcon, BenefitIcon, BenefitIcon];
}

/**
 * TEST-007: 유형별로 요금제와 혜택을 어디서 찾을지 적어둔 표.
 *
 * 결과 화면은 세 줄이다 - 첫 줄에 어울리는 요금제, 나머지 두 줄에 지금 그대로
 * 누리는 혜택(U+ 멤버십 제휴 할인, 취미형 부가서비스, 요금제에 딸린 혜택 문구)이
 * 들어간다.
 *
 * 유형마다 보는 카테고리와 혜택 칸을 다르게 잡아, 같은 줄이 여러 유형에 반복되지
 * 않게 한다. 상품이나 브랜드가 늘어나면 이 표만 고치면 된다(고르는 규칙은
 * lib/selectTypeBenefits).
 */
export const TYPE_BENEFIT_SOURCES: Record<LeisureTypeId, TypeBenefitSource> = {
  // 집이 제일 편한 유형 - 집에서 보는 영상, 집 결합, 가까운 편의점
  jamjam: {
    planKeywords: ['넷플릭스', '디즈니', '웨이브', '인터넷', 'TV', '클라우드'],
    planBenefitKeys: ['media_contents', 'home_bundle'],
    membershipCategories: ['생활/편의'],
    addOnKeywords: ['모바일tv'],
    icons: ['monitor', 'ticket', 'wifi'],
  },

  // 집 콘텐츠와 동네 한 바퀴가 반반인 유형 - 동네에서 쓰는 쿠폰
  daily: {
    planKeywords: ['티빙', '편의점', '쿠폰', '카페', '데이터'],
    planBenefitKeys: ['coupon_benefit', 'media_contents'],
    membershipCategories: ['푸드'],
    addOnKeywords: ['안심옵션'],
    icons: ['ticket', 'monitor', 'shield'],
  },

  // 배우고 만들고 보러 다니는 취미 부자 - 영화관, 음악, 문화 멤버십
  pop: {
    planKeywords: ['음악', '콘텐츠', 'VIP'],
    planBenefitKeys: ['vip_membership', 'media_contents'],
    membershipCategories: ['문화/여가'],
    addOnKeywords: ['지니뮤직'],
    icons: ['shield', 'ticket', 'monitor'],
  },

  // 주말이 더 바쁜 유형 - 나가서 쓰는 로밍·라운지·액티비티
  super: {
    planKeywords: ['로밍', '라운지', '해외'],
    planBenefitKeys: ['roaming', 'airport_lounge'],
    membershipCategories: ['액티비티', '뷰티/건강'],
    addOnKeywords: [],
    icons: ['wifi', 'ticket', 'shield'],
  },
};
