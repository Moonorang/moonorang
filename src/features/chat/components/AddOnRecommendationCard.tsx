'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/shared/ui/Button';

import { AddOnListItem } from '@/entities/addOn';
import AddOnDetailModal from '@/entities/addOn/ui/AddOnDetailModal';
import type { AddOn } from '@/entities/addOn/types';
import CatalogCard from '@/shared/ui/CatalogCard';
import type { AddOnRecommendation } from '@/features/chat/types';

interface AddOnRecommendationCardProps {
  recommendations: AddOnRecommendation[];
  /** DATA-010: 상세에서 신청하기를 누르면 대화에 가입 카드를 띄운다 */
  onJoin?: (addOn: AddOn) => void;
}

/**
 * CARD-027~028: 관심사에 맞춘(없으면 인기순) 부가서비스 추천 카드.
 * addOnRecommendation 이벤트 하나를 그대로 받아 그린다 - 목록 전체 높이는 제한을
 * 두고(관심사 매칭이 많으면 최대 6개까지 나올 수 있다 - selectAddOns.ts의
 * MAX_ADD_ON_RESULTS) 넘치는 만큼만 내부 스크롤로 본다. 카드 하나하나는
 * shared/ui/CatalogCard의 shrink-0 덕분에 항상 자기 내용만큼의 높이를 유지하고
 * (넘칠 때 개별 카드가 찌그러지는 대신 목록 스크롤이 뜬다).
 * "둘러보기"는 부가서비스 탭이 활성화된 상품 목록으로 이동한다.
 *
 * 목록 페이지(features/catalog)의 AddOnRow와 같은 entities/addOn의 AddOnListItem +
 * shared/ui/CatalogCard를 그대로 재사용한다 - 새로 만들지 않는다. 상세 모달도
 * 목록과 같은 것(AddOnDetailModal)을 띄우고, 차이는 adoptionRate 배지 하나뿐이다
 * (목록 페이지엔 없는 채팅 전용 정보).
 *
 * 목록과 달라지는 것은 상세에서 신청하기를 눌렀을 때다 - 목록은 채팅으로 넘어가지만
 * 여기는 이미 채팅 안이라 그 자리에 가입 카드를 띄운다.
 */
export default function AddOnRecommendationCard({
  recommendations,
  onJoin,
}: AddOnRecommendationCardProps) {
  // 1. 상태 및 훅
  const router = useRouter();
  // 열려 있는 상세. null 이면 닫힌 상태 - 목록의 useCatalogDetail 과 같은 모양이다
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);

  // 2. 이벤트 핸들러
  const handleJoinClick = (addOn: AddOn) => {
    // 가입 카드는 대화 맨 끝에 붙으므로, 화면을 덮고 있는 상세를 먼저 걷어낸다
    setSelectedAddOn(null);
    onJoin?.(addOn);
  };

  // 3. 렌더링
  if (recommendations.length === 0) return null;

  return (
    <div className="flex w-[min(80%,440px)] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default">
      <h3 className="text-16 font-semibold text-text-primary">
        부가서비스 추천
      </h3>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {recommendations.map((item) => (
          <CatalogCard
            key={item.addOn.id}
            appendClassName="shadow-none border border-border-default"
          >
            <AddOnListItem
              addOn={item.addOn}
              adoptionRate={item.adoptionRate}
              onClick={() => setSelectedAddOn(item.addOn)}
            />
          </CatalogCard>
        ))}
      </div>

      <Button
        variant="main"
        radius="sm"
        size="lg"
        isFullWidth
        onClick={() => router.push('/catalog?tab=addOns')}
      >
        둘러보기
      </Button>

      {/* DATA-009: 항목을 누르면 목록에서와 같은 상세가 화면을 덮으며 들어온다 */}
      <AddOnDetailModal
        addOn={selectedAddOn}
        onClose={() => setSelectedAddOn(null)}
        onJoin={handleJoinClick}
      />
    </div>
  );
}
