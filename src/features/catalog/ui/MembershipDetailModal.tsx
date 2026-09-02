'use client';

import FullModal from '@/shared/ui/FullModal';

import MembershipDetailCard from '@/features/catalog/ui/MembershipDetailCard';
import type { MembershipBrand } from '@/entities/membershipBrand/types';

interface MembershipDetailModalProps {
  /** 열려 있는 제휴 브랜드. null 이면 모달이 닫힌 상태 */
  brand: MembershipBrand | null;
  onClose: () => void;
}

/**
 * DATA-019: 목록에서 멤버십 제휴처 하나를 눌렀을 때 화면을 덮으며 들어오는 상세.
 * 바닥과 헤더는 FullModal 이 깔고, 이 화면은 그 위에 올릴 카드 한 장을 맡는다 -
 * 요금제·부가서비스·구독 상세와 같은 구조다.
 *
 * 다른 상세와 달리 가입으로 이어지지 않는다. 멤버십은 가입하는 상품이 아니라
 * 이미 가진 멤버십으로 받을 수 있는 제휴 할인 정보라, 확인하고 닫는 것으로 끝난다.
 */
export default function MembershipDetailModal({
  brand,
  onClose,
}: MembershipDetailModalProps) {
  return (
    <FullModal
      isOpen={brand !== null}
      onClose={onClose}
      ariaLabel={brand ? `${brand.name} 제휴사 상세정보` : '제휴사 상세정보'}
    >
      {brand && (
        <div className="px-4 pt-5 pb-6">
          <div className="rounded-md bg-background-default p-4 shadow-default">
            <MembershipDetailCard brand={brand} onConfirm={onClose} />
          </div>
        </div>
      )}
    </FullModal>
  );
}
