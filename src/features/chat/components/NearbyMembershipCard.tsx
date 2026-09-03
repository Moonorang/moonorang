'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Locate, MapPin } from 'lucide-react';
import {
  CustomOverlayMap,
  Map,
  MapMarker,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

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
 * "길찾기" - 우리 지도는 경로 안내를 직접 그리지 않는다(그러려면 별도의 Kakao
 * Mobility 길찾기 API가 필요함) - 대신 카카오맵 자체의 길찾기 URL 스킴으로
 * 넘긴다. 내 위치를 알고 있으면 출발지까지 명시해서 "현재 위치 -> {지점명}"이
 * 검색창에 그대로 채워지게 하고(from/to 스킴), 아직 위치가 없으면 도착지만
 * 넘긴다(to 스킴) - 그땐 카카오맵이 열리면서 접속 기기 위치를 출발지로 알아서
 * 잡아준다. name엔 브랜드명이 아니라 실제로 검색된 지점명(placeName)을 넘겨야
 * "CGV"가 아니라 "CGV 강남"처럼 정확한 지점이 목적지로 찾힌다.
 * (https://apis.map.kakao.com/web/guide/)
 */
function buildKakaoDirectionsUrl(
  destinationName: string,
  destLat: number,
  destLng: number,
  origin: { lat: number; lng: number } | null,
): string {
  const destination = `${encodeURIComponent(destinationName)},${destLat},${destLng}`;
  if (!origin) {
    return `https://map.kakao.com/link/to/${destination}`;
  }
  const from = `${encodeURIComponent('현재 위치')},${origin.lat},${origin.lng}`;
  return `https://map.kakao.com/link/from/${from}/to/${destination}`;
}

/**
 * 지도가 담긴 컨테이너의 실제 크기가 바뀌면(예: 채팅 말풍선 폭이 마운트 직후
 * 폰트·레이아웃이 자리 잡으며 달라지는 경우) 카카오 지도가 생성 시점 크기로
 * 타일을 그려둔 채라 화면과 안 맞아 흐리게 보인다 - relayout()으로 다시
 * 맞춰줘야 한다(카카오 공식 안내). ResizeObserver로 컨테이너 크기 변화를
 * 감지해서 매번 relayout을 호출한다.
 *
 * 그런데 ResizeObserver는 "그 이후에 크기가 또 바뀔 때만" relayout을 부른다 -
 * 지도가 생성된 바로 그 순간에 컨테이너가 이미 최종 크기와 다르게 잡혀 있고
 * 그 뒤로 한 번도 안 바뀌는 경우(작은 미리보기 지도처럼, 카드 폭이 마운트
 * 직후 자리 잡고 나서 다시는 안 바뀌는 경우)엔 이 관찰만으로는 못 잡는다.
 * registerMap을 onCreate에서 불러서 생성 직후 여러 프레임에 걸쳐 컨테이너
 * 크기를 지켜본다 - 폰트 로딩 등으로 레이아웃이 한 프레임 뒤에도 또 바뀌는
 * 경우까지 잡기 위해 한 번이 아니라 짧게(약 10프레임, 0.15초) 확인한다.
 * 다만 매 프레임 무조건 relayout+recenter를 부르면(이전 버전) 크기가 그대로인
 * 프레임에도 지도를 계속 다시 그려서 눈에 띄게 깜빡였다 - 그래서 컨테이너의
 * 실측 크기가 실제로 바뀐 프레임에서만 호출한다. relayout()은 center를
 * 흐트러뜨릴 수 있어서(카카오 데브톡 안내), 부를 때마다 그 뒤에 bounds/center를
 * 다시 맞추는 콜백을 같이 받는다.
 */
function useMapRelayout() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.relayout();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const registerMap = (map: kakao.maps.Map, recenter: () => void) => {
    mapRef.current = map;

    let lastWidth = -1;
    let lastHeight = -1;
    let framesLeft = 10;

    const tick = () => {
      const container = containerRef.current;
      const width = container?.clientWidth ?? -1;
      const height = container?.clientHeight ?? -1;

      // 크기가 실제로 바뀐 프레임(최초 1회 포함)에만 다시 그린다 - 그대로인
      // 프레임까지 매번 relayout하면 깜빡임만 생기고 얻는 게 없다.
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        map.relayout();
        recenter();
      }

      framesLeft -= 1;
      if (framesLeft > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return { containerRef, mapRef, registerMap };
}

/**
 * onCreate에서 핀이 여러 개(내 위치 포함)면 전부 화면에 들어오게 범위를 잡는다.
 *
 * maxLevel을 주면, 핀들이 넓게 흩어져 있어서 setBounds가 너무 멀리 축소해버리는
 * 경우 그 확대 수준으로 다시 당겨준다 - 카카오 지도 JS SDK는 고밀도(레티나)
 * 디스플레이용 타일을 따로 제공하지 않는 래스터 지도라, 많이 축소될수록(카메라가
 * 멀어질수록) 같은 타일 흐림이 화면에서 상대적으로 더 크게 도드라져 보인다.
 * 좁은 미리보기 지도(140px)에서 특히 체감이 커서, 모든 핀을 다 담는 것보다
 * 어느 정도 이상 확대된 상태를 유지하는 쪽을 택한다 - 나머지는 탭해서 여는
 * 전체 모달에서 보면 된다.
 */
function fitBoundsToPoints(
  map: kakao.maps.Map,
  points: { lat: number; lng: number }[],
  padding: number,
  maxLevel?: number,
) {
  if (points.length < 2) return;
  const bounds = new kakao.maps.LatLngBounds();
  points.forEach((point) => {
    bounds.extend(new kakao.maps.LatLng(point.lat, point.lng));
  });
  map.setBounds(bounds, padding);

  if (maxLevel !== undefined && map.getLevel() > maxLevel) {
    map.setLevel(maxLevel);
  }
}

/**
 * 카드 상단에 얹는 미니 지도(미리보기) - 가운데에 내 위치를, 그 주변에 목록의
 * 지점들을 핀으로 찍어서 한눈에 위치 관계를 보여준다. 드래그·휠줌은 꺼둔다 -
 * 스크롤되는 채팅 화면 안에 얹히므로, 켜두면 채팅을 스와이프하다가 지도 위에서
 * 손가락이 걸려 지도만 움직이는 일이 생긴다. 탭하면 onExpand로 실제 조작 가능한
 * 전체 모달을 연다.
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
function NearbyMembershipMapPreview({
  memberships,
  userLocation,
  onExpand,
}: {
  memberships: NearbyMembership[];
  userLocation: { lat: number; lng: number } | null;
  onExpand: () => void;
}) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '',
  });
  const { containerRef, registerMap } = useMapRelayout();

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
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="지도 크게 보기"
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onExpand();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-md"
      style={{ width: '100%', height: `${MAP_HEIGHT_PX}px` }}
    >
      <Map
        center={center}
        level={5}
        draggable={false}
        zoomable={false}
        style={{ width: '100%', height: '100%' }}
        onCreate={(map) => {
          // 내 위치 + 혜택 지점 전부가 한눈에 들어와야 해서 축소 상한은 두지 않는다
          // (흐림 완화용 상한을 뒀더니 오히려 일부 핀이 화면 밖으로 밀려났었다).
          const applyBounds = () => fitBoundsToPoints(map, points, 32);
          applyBounds();
          registerMap(map, applyBounds);
        }}
      >
        {userLocation && (
          // title을 안 주는 이유는 아래 브랜드 핀과 같다 - 네이티브 브라우저
          // 툴팁이 뜨는 걸 막기 위함.
          <MapMarker
            position={userLocation}
            image={MY_LOCATION_MARKER_IMAGE}
            zIndex={10}
          />
        )}
        {pins.map((item) => (
          // title을 안 준다 - 카카오 SDK가 이걸 마커 이미지의 title 속성으로 그대로
          // 얹어서, 브라우저 네이티브 툴팁(우리 커스텀 팝업과 별개로 뜨는 작은 창)이
          // 나타난다.
          <MapMarker
            key={item.brand.id}
            position={{ lat: item.lat, lng: item.lng }}
          />
        ))}
      </Map>
    </div>
  );
}

/**
 * 미니 지도를 탭했을 때 뜨는 전체 화면 모달. 여기서는 실제로 드래그·확대/축소가
 * 되고, "현위치로 가기"로 내 위치로 다시 이동할 수 있다. 실제 길찾기(경로 안내)는
 * 우리 지도가 직접 그리지 않고 - 목록의 "길찾기" 버튼이 카카오맵으로 넘긴다
 * (buildKakaoDirectionsUrl 참고).
 */
function NearbyMembershipMapModal({
  memberships,
  userLocation,
  onClose,
}: {
  memberships: NearbyMembership[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '',
  });
  const { containerRef, mapRef, registerMap } = useMapRelayout();
  // 목록 카드를 누르거나 핀을 누르면 같은 값이 채워진다 - 카드는 배경색이,
  // 핀은 정보창(브랜드명·지점명·길찾기 버튼)이 이 값 하나로 같이 움직인다.
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // COMMON-005: 모달이 떠 있는 동안 배경 스크롤을 막고, Escape로 닫을 수 있게 한다.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const pins = memberships.filter(hasValidCoords);
  const center =
    userLocation ?? (pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : null);
  const points = userLocation ? [userLocation, ...pins] : pins;

  const handleGoToMyLocation = () => {
    if (!userLocation) return;
    mapRef.current?.setCenter(
      new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
    );
    mapRef.current?.setLevel(4);
  };

  /** 목록 카드를 누르면 선택 표시하고, 그 핀이 지도 한가운데로 오도록 부드럽게 이동한다. */
  const handleSelectItem = (
    item: NearbyMembership & { lat: number; lng: number },
  ) => {
    setSelectedBrandId(item.brand.id);
    mapRef.current?.panTo(new kakao.maps.LatLng(item.lat, item.lng));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="내 주변 혜택 지도"
      className="fixed inset-0 z-(--z-modal) flex flex-col bg-background-page"
    >
      <div className="mx-auto flex h-full w-full max-w-(--width-container) min-w-(--width-container-min) flex-col bg-background-default">
        {/* 로그인 화면 등 다른 흐름 화면과 같은 뒤로가기 전용 헤더 모양(제목·우측
            아이콘 없음) - Header.tsx의 variant="back"을 그대로 흉내낸다. 그
            컴포넌트 자체는 fixed 포지션이라 이 모달(이미 fixed) 안에 그대로
            끼워 넣으면 레이어가 꼬여서, 같은 모양만 여기서 다시 그린다. */}
        <div className="flex h-(--height-header) shrink-0 items-center border-b border-border-default px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="지도 닫기"
            className="flex h-6 w-6 items-center justify-center text-text-secondary transition-colors hover:cursor-pointer hover:text-text-primary"
          >
            <ChevronLeft size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="border-b border-border-default bg-background-subtle px-4 py-2 text-16 font-medium text-text-primary">
          지도에서 핀을 누르면 해당 가맹점과 길찾기를 확인하실 수 있습니다
        </p>

        <div ref={containerRef} className="relative flex-1">
          {!loading && !error && center && (
            <Map
              center={center}
              level={4}
              draggable
              zoomable
              style={{ width: '100%', height: '100%' }}
              onCreate={(map) => {
                const applyBounds = () => fitBoundsToPoints(map, points, 64);
                applyBounds();
                registerMap(map, applyBounds);
              }}
            >
              {userLocation && (
                // title을 안 준다 - 카카오 SDK가 마커 이미지의 title 속성으로 그대로
                // 얹어서, 우리 커스텀 팝업과 별개로 브라우저 네이티브 툴팁이 뜬다.
                <MapMarker
                  position={userLocation}
                  image={MY_LOCATION_MARKER_IMAGE}
                  zIndex={10}
                />
              )}
              {pins.map((item) => (
                <Fragment key={item.brand.id}>
                  <MapMarker
                    position={{ lat: item.lat, lng: item.lng }}
                    onClick={() => setSelectedBrandId(item.brand.id)}
                  />

                  {/* MapMarker의 children은 카카오 InfoWindow로 렌더링돼서, 그
                      자체가 흰 배경·테두리·꼬리 같은 기본 틀을 항상 같이 그린다 -
                      우리 팝업 디자인과 별개로 그 틀이 겹쳐 보였다. 기본 틀이
                      전혀 없는 CustomOverlay(=CustomOverlayMap)로 마커와 분리해서,
                      완전히 우리 스타일대로만 뜨게 한다. */}
                  {selectedBrandId === item.brand.id && (
                    <CustomOverlayMap
                      position={{ lat: item.lat, lng: item.lng }}
                      yAnchor={1.2}
                      zIndex={20}
                      clickable
                    >
                      <div className="flex flex-col items-center gap-1.5 rounded-sm border border-border-default bg-background-default p-3">
                        <p className="flex items-center gap-1 text-10 font-semibold whitespace-nowrap text-text-primary">
                          <MapPin
                            size={12}
                            className="shrink-0 text-action-primary"
                            aria-hidden
                          />
                          {item.brand.name} · {item.placeName}
                        </p>
                        <Button
                          variant="main"
                          radius="sm"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            window.open(
                              buildKakaoDirectionsUrl(
                                item.placeName,
                                item.lat,
                                item.lng,
                                userLocation,
                              ),
                              '_blank',
                              'noopener,noreferrer',
                            );
                          }}
                        >
                          길찾기
                        </Button>
                      </div>
                    </CustomOverlayMap>
                  )}
                </Fragment>
              ))}
            </Map>
          )}

          {userLocation && (
            <Button
              variant="outline"
              radius="full"
              size="none"
              onClick={handleGoToMyLocation}
              aria-label="현위치로 가기"
              appendClassName="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center bg-background-default shadow-default"
            >
              <Locate size={20} aria-hidden />
            </Button>
          )}
        </div>

        <div className="flex max-h-[45%] shrink-0 flex-col gap-2 overflow-y-auto border-t border-border-default p-4">
          {/* 지도에 핀을 찍은(=좌표가 있는) 가맹점만 목록에 올린다 - 핀과 카드가 항상 1:1로 대응해야
              누르면 서로 선택·이동시키는 동작이 어색하지 않다. */}
          {pins.map((item) => (
            <NearbyMembershipItem
              key={item.brand.id}
              item={item}
              isSelected={selectedBrandId === item.brand.id}
              onSelect={() => handleSelectItem(item)}
              onDirections={() =>
                window.open(
                  buildKakaoDirectionsUrl(
                    item.placeName,
                    item.lat,
                    item.lng,
                    userLocation,
                  ),
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)}m`
    : `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 항목 하나. 미니 지도 미리보기(카드 안)에서는 onSelect/onDirections를 안 줘서
 * AddOnRecommendationItem과 같은 이유로 클릭 핸들러가 없는 정보 표시용으로 쓰고
 * (상세는 다른 팀원이 만들고 있어서, 지금은 눌러도 아무 일도 안 일어나야 한다),
 * 전체 모달(NearbyMembershipMapModal)에서는 세 props를 다 줘서 "누르면 선택
 * 표시 + 지도에서 그 핀으로 이동", "길찾기 버튼"까지 되는 카드로 쓴다.
 */
function NearbyMembershipItem({
  item,
  isSelected = false,
  onSelect,
  onDirections,
}: {
  item: NearbyMembership;
  isSelected?: boolean;
  onSelect?: () => void;
  onDirections?: () => void;
}) {
  const { brand, placeName, distanceMeters } = item;
  const discountSummary = brand.discountRules?.summary;

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        'flex items-stretch overflow-hidden rounded-md border text-left transition-colors',
        onSelect && 'cursor-pointer',
        isSelected ? 'border-action-primary' : 'border-border-default',
      )}
    >
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

      {onDirections && (
        <div className="flex shrink-0 items-center pr-2">
          <Button
            variant="main"
            radius="sm"
            size="md"
            onClick={(event) => {
              event.stopPropagation();
              onDirections();
            }}
          >
            길찾기
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * CARD-028: 현재 위치 기준으로 가까운 멤버십 제휴처 카드.
 * nearbyMembership 이벤트 하나를 그대로 받아 그린다 - 브랜드마다 가장 가까운 지점
 * 1개씩, 가까운 순으로 이미 정렬돼서 온다(findNearbyMemberships.ts). 미니 지도를
 * 탭하면 드래그·확대가 되는 전체 모달이 뜨고, "내 주변 혜택 알아보기"는 멤버십
 * 탭이 활성화된 상품 목록으로 이동한다.
 */
export default function NearbyMembershipCard({
  memberships,
  userLocation,
}: NearbyMembershipCardProps) {
  const router = useRouter();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  if (memberships.length === 0) return null;

  return (
    <div className="flex w-[min(80%,440px)] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-14 font-bold text-text-primary">내 주변 혜택</h3>

      <NearbyMembershipMapPreview
        memberships={memberships}
        userLocation={userLocation}
        onExpand={() => setIsMapModalOpen(true)}
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

      <AnimatePresence>
        {isMapModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <NearbyMembershipMapModal
              memberships={memberships}
              userLocation={userLocation}
              onClose={() => setIsMapModalOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
