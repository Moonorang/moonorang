import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { SSESend } from '@/features/chat/lib/sse';
import type { NearbyMembership } from '@/features/chat/types';
import { searchPlacesByKeyword, type KakaoPlace } from '@/shared/lib/kakao/localSearch';

// 화면 카드가 감당할 상한
const MAX_RESULTS = 5;

// 브랜드명으로 시작하는 진짜 지점이 상위 몇 개 안에 없을 수 있다(예: "CGV"로 검색하면
// 무관한 업종이 지점명에 랜드마크로 "CGV"를 끼워 넣어 먼저 나오고, 진짜 CGV 지점은
// 8번째쯤에야 나오는 경우가 실측됐다). 카카오 API 상한(15)까지 받아서 pickBestMatch가
// 그중에서 고를 수 있게 한다.
const SEARCH_CANDIDATE_SIZE = 15;

/**
 * 브랜드 하나에 대한 후보(거리순)에서 실제로 그 브랜드일 가능성이 높은 지점을
 * 고른다. 카카오 키워드 검색은 지점명에 브랜드명이 우연히 들어간 무관한 업종도
 * 섞어서 돌려준다(예: "CGV"로 검색하면 "역전할머니맥주 강남역CGV점"이 최근접으로
 * 잡히는 경우가 있었다 - 실측 확인). 지점명이 브랜드명으로 "시작하는" 후보를
 * 우선하고, 그런 후보가 하나도 없으면(DB 표기와 실제 지점명 표기가 다른 경우 등)
 * 기존처럼 가장 가까운 후보로 완화한다 - 표기 차이 때문에 결과 자체가 사라지는
 * 것보다는 낫다.
 */
function pickBestMatch(brandName: string, candidates: KakaoPlace[]): KakaoPlace | null {
  if (candidates.length === 0) return null;
  const prefixMatch = candidates.find((candidate) => candidate.placeName.startsWith(brandName));
  return prefixMatch ?? candidates[0];
}

/**
 * CARD-028: find_nearby_memberships가 트리거되면 실제 검색을 수행한다.
 *
 * membership_brands에는 지점 위치가 없다(docs/database-schema.md) - 브랜드마다
 * 카카오 로컬 API로 "이 브랜드명 + 내 위치에서 가까운 지점" 후보들을 찾아 그중
 * 진짜 그 브랜드로 보이는 지점 1개를 고르고(pickBestMatch), 그렇게 모은
 * 브랜드별 지점들을 다시 거리 오름차순으로 정렬한다. 그래서 같은 브랜드가 두 번
 * 나오는 일 없이, 서로 다른 브랜드가 가까운 순으로 나온다.
 *
 * 위치 정보가 없으면(브라우저 위치 권한을 아직 안 받았거나 거부한 경우) 검색
 * 자체를 시도하지 않고 ok: false를 돌려준다 - login 필요한 analyze_savings와
 * 같은 패턴(reason으로 사유 구분, CARD-005/COMMON-002).
 */
export async function runFindNearbyMemberships(
  location: { lat: number; lng: number } | undefined,
  send: SSESend,
  brands: MembershipBrand[],
): Promise<unknown> {
  if (!location) {
    return { ok: false, reason: 'no_location' as const };
  }

  const nearestPerBrand = await Promise.all(
    brands.map(async (brand): Promise<NearbyMembership | null> => {
      const candidates = await searchPlacesByKeyword({
        query: brand.name,
        lat: location.lat,
        lng: location.lng,
        size: SEARCH_CANDIDATE_SIZE,
      });
      const place = pickBestMatch(brand.name, candidates);
      if (!place) return null;

      return {
        brand,
        placeName: place.placeName,
        distanceMeters: place.distanceMeters,
        lat: place.lat,
        lng: place.lng,
      };
    }),
  );

  const memberships = nearestPerBrand
    .filter((item): item is NearbyMembership => item !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, MAX_RESULTS);

  send({ event: 'nearbyMembership', data: { memberships } });

  // 다음 턴에서 모델이 자연어로 마무리 발언을 할 때 참고할 사실 - 실제 검색 결과.
  return {
    ok: true,
    memberships: memberships.map((item) => ({
      brand: item.brand.name,
      category: item.brand.category,
      placeName: item.placeName,
      distanceMeters: item.distanceMeters,
      discountSummary: item.brand.discountRules?.summary,
    })),
  };
}
