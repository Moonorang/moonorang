'use client';

import { useRouter } from 'next/navigation';

import { MapPin } from 'lucide-react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

import Button from '@/shared/ui/Button';

import type { NearbyMembership } from '@/features/chat/types';

interface NearbyMembershipCardProps {
  memberships: NearbyMembership[];
  /** 지도 중심에 찍을 사용자의 현재 위치. 아직 못 얻었으면 null */
  userLocation: { lat: number; lng: number } | null;
}

const MAP_HEIGHT_PX = 140;

// "내 위치" 핀은 브랜드 핀(카카오 기본 빨간 마커)과 구분되게 파란 점으로 따로 그린다 -
// 이미지 에셋을 새로 추가하지 않고 인라인 SVG data URI로 만든다.
const MY_LOCATION_MARKER_IMAGE = {
  src: `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#2563eb" stroke="white" stroke-width="3"/></svg>',
  )}`,
  size: { width: 20, height: 20 },
};

function hasValidCoords(
  item: NearbyMembership,
): item is NearbyMembership & { lat: number; lng: number } {
  return (
    typeof item.lat === 'number' &&
    typeof item.lng === 'number' &&
    Number.isFinite(item.lat) &&
    Number.isFinite(item.lng)
  );
}

/**
 * 카드 상단에 얹는 미니 지도 - 가운데에 내 위치를, 그 주변에 목록의 지점들을
 * 핀으로 찍어서 한눈에 위치 관계를 보여준다. 스크롤되는 채팅 화면 안에
 * 얹히므로 드래그·휠줌은 꺼둔다 - 켜두면 채팅을 위아래로 스와이프하다가 지도
 * 위에서 손가락이 걸려 지도만 움직이는 일이 생긴다. 실제 탐색은 "내 주변 혜택
 * 알아보기" 버튼으로 이동하는 상세 화면(다른 팀원 작업)에서 하면 된다 -
 * 여기는 미리보기다.
 *
 * useKakaoLoader가 SDK 스크립트 로딩을 맡는다(최초 한 번만, 이후 재사용) -
 * NEXT_PUBLIC_KAKAO_MAP_KEY는 이미 도메인 제한이 걸린 JS 키라 클라이언트에
 * 노출해도 안전하다(REST 키와 다름, docs/chat-api-design.md 논의 참고). 다만
 * 이 앱키에 Kakao Developers 콘솔의 "Web 플랫폼"으로 실제 접속 도메인이
 * 등록돼 있어야 로드된다 - 등록이 안 돼 있으면 스크립트는 받아오지만 지도가
 * 뜨지 않고 콘솔에 인증 에러만 남는다.
 *
 * 이 대화가 이번 세션 이전(예: 예전 코드가 좌표를 안 담던 때, 또는 로그인 전
 * localStorage에 저장된 대화)에 만들어졌으면 memberships에 lat/lng가 아예
 * 없을 수 있다 - 그런 항목은 걸러내고, 하나도 안 남으면 지도 자체를 숨긴다
 * (목록은 좌표 없이도 그려지므로 카드가 통째로 사라지진 않는다).
 */
function NearbyMembershipMap({
  memberships,
  userLocation,
}: {
  memberships: NearbyMembership[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '',
  });

  if (error) {
    // 지도가 안 뜨는 원인(도메인 미등록 등)을 콘솔에서라도 바로 알 수 있게
    // 남긴다. 화면엔 그냥 카드 없이 목록만 보여준다.
    console.error('[kakao] 지도 SDK 로드 실패:', error);
  }

  const pins = memberships.filter(hasValidCoords);
  if (loading || error || (pins.length === 0 && !userLocation)) return null;

  const center = userLocation ?? { lat: pins[0].lat, lng: pins[0].lng };
  const points = userLocation ? [userLocation, ...pins] : pins;

  return (
    <Map
      center={center}
      level={6}
      draggable={false}
      zoomable={false}
      style={{ width: '100%', height: `${MAP_HEIGHT_PX}px` }}
      className="rounded-md"
      onCreate={(map) => {
        // 핀이 여러 개면(내 위치 포함) 전부 화면에 들어오도록 영역을 다시
        // 잡는다 - 초기 center/level은 점이 하나뿐일 때를 위한 값이라 그
        // 경우엔 그대로 둔다.
        if (points.length < 2) return;
        const bounds = new kakao.maps.LatLngBounds();
        points.forEach((point) => {
          bounds.extend(new kakao.maps.LatLng(point.lat, point.lng));
        });
        map.setBounds(bounds, 32);
      }}
    >
      {userLocation && (
        <MapMarker
          position={userLocation}
          image={MY_LOCATION_MARKER_IMAGE}
          title="내 위치"
          zIndex={10}
        />
      )}
      {pins.map((item) => (
        <MapMarker
          key={item.brand.id}
          position={{ lat: item.lat, lng: item.lng }}
          title={item.brand.name}
        />
      ))}
    </Map>
  );
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)}m`
    : `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 항목 하나. AddOnRecommendationItem과 같은 이유로 클릭 핸들러를 아예 안 단다 -
 * 상세는 다른 팀원이 만들고 있어서, 지금은 눌러도 아무 일도 안 일어나야 한다.
 */
function NearbyMembershipItem({ item }: { item: NearbyMembership }) {
  const { brand, placeName, distanceMeters } = item;
  const discountSummary = brand.discountRules?.summary;

  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-border-default">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 bg-action-primary p-2 text-background-default">
        <MapPin size={18} aria-hidden />
        <span className="text-12 font-medium">
          {formatDistance(distanceMeters)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        <p className="font-regular truncate text-10 text-text-secondary">
          {placeName}
        </p>
        {discountSummary && (
          <p className="truncate text-14 font-medium text-text-primary">
            {discountSummary}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * CARD-028: 현재 위치 기준으로 가까운 멤버십 제휴처 카드.
 * nearbyMembership 이벤트 하나를 그대로 받아 그린다 - 브랜드마다 가장 가까운 지점
 * 1개씩, 가까운 순으로 이미 정렬돼서 온다(findNearbyMemberships.ts). "내 주변 혜택
 * 알아보기"는 멤버십 탭이 활성화된 상품 목록으로 이동한다.
 */
export default function NearbyMembershipCard({
  memberships,
  userLocation,
}: NearbyMembershipCardProps) {
  const router = useRouter();

  if (memberships.length === 0) return null;

  return (
    <div className="flex w-[80%] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-14 font-bold text-text-primary">내 주변 혜택</h3>

      <NearbyMembershipMap
        memberships={memberships}
        userLocation={userLocation}
      />

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {memberships.map((item) => (
          <NearbyMembershipItem key={item.brand.id} item={item} />
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth
        onClick={() => router.push('/catalog?tab=memberships')}
      >
        혜택 더 알아보기
      </Button>
    </div>
  );
}
