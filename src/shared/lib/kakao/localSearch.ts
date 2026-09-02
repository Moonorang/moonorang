// 카카오 로컬 API - 키워드로 장소 검색 (서버 전용).
// https://developers.kakao.com/docs/latest/ko/local/dev-guide - REST API 키는
// 도메인 제한 같은 보호장치가 없어서 클라이언트에 노출하면 안 된다(KAKAO_REST_API_KEY,
// NEXT_PUBLIC_ 접두사 없음). 그래서 이 파일은 route handler/server action에서만 부른다.

const KAKAO_KEYWORD_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';

export interface KakaoPlace {
  placeName: string;
  addressName: string;
  roadAddressName: string;
  /** 중심 좌표(x,y를 준 요청)로부터의 거리(m). 응답에 원래 문자열로 오는 걸 숫자로 바꿔둔다 */
  distanceMeters: number;
  placeUrl: string;
}

interface KakaoKeywordSearchDocument {
  place_name: string;
  address_name: string;
  road_address_name: string;
  distance: string;
  place_url: string;
}

interface KakaoKeywordSearchResponse {
  documents: KakaoKeywordSearchDocument[];
}

interface SearchPlacesByKeywordParams {
  /** 검색어 - 브랜드명을 그대로 쓴다 */
  query: string;
  lat: number;
  lng: number;
  /** 검색 반경(m). 카카오 API 상한은 20000 */
  radiusMeters?: number;
  /** 가져올 후보 개수(최대 15) - 여러 개를 받아야 findNearbyMemberships.ts가
   * "브랜드명으로 시작하는" 진짜 지점을 그중에서 골라낼 수 있다. */
  size?: number;
}

const DEFAULT_RADIUS_METERS = 5000;
const DEFAULT_SIZE = 5;

/**
 * 브랜드명으로 검색해서, 준 좌표에서 가까운 순으로 후보를 여러 개 돌려준다
 * (sort=distance). 카카오 키워드 검색은 "이 브랜드의 매장"이 아니라 "이름에 이
 * 글자가 들어간 장소"를 전부 찾는다 - 예를 들어 "CGV"로 검색하면 실제 영화관과
 * 무관한, 지점명에 "OO역CGV점"처럼 글자만 우연히 들어간 다른 업종도 섞여
 * 나온다(실측 확인). 그래서 결과 하나만 받지 않고 여러 개를 받아, 호출부가
 * 브랜드명으로 시작하는 진짜 지점을 그중에서 고르게 한다.
 * 검색 결과가 없거나 요청이 실패하면 빈 배열 - 호출부가 그 브랜드만 건너뛴다.
 */
export async function searchPlacesByKeyword({
  query,
  lat,
  lng,
  radiusMeters = DEFAULT_RADIUS_METERS,
  size = DEFAULT_SIZE,
}: SearchPlacesByKeywordParams): Promise<KakaoPlace[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('[kakao] KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    return [];
  }

  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('x', String(lng));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('sort', 'distance');
  url.searchParams.set('size', String(size));

  try {
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });

    if (!response.ok) {
      console.error(
        `[kakao] 장소 검색 실패 (${query}): ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = (await response.json()) as KakaoKeywordSearchResponse;

    return data.documents.map((document) => ({
      placeName: document.place_name,
      addressName: document.address_name,
      roadAddressName: document.road_address_name,
      distanceMeters: Number(document.distance),
      placeUrl: document.place_url,
    }));
  } catch (error) {
    console.error(`[kakao] 장소 검색 요청 실패 (${query}):`, error);
    return [];
  }
}
