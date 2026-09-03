'use client';

import FullModal from '@/shared/ui/FullModal';

import AddOnDetailCard from '@/entities/addOn/ui/AddOnDetailCard';
import type { AddOn } from '@/entities/addOn/types';

interface AddOnDetailModalProps {
  /** 열려 있는 부가서비스. null 이면 모달이 닫힌 상태 */
  addOn: AddOn | null;
  onClose: () => void;
  /** DATA-010: 상세에서 바로 가입으로 이어지는 자리 */
  onJoin: (addOn: AddOn) => void;
}

/**
 * DATA-009: 목록에서 부가서비스 하나를 눌렀을 때 화면을 덮으며 들어오는 상세.
 * 바닥과 헤더는 FullModal 이 깔고, 이 화면은 그 위에 올릴 카드 한 장을 맡는다 -
 * 요금제 상세(PlanDetailModal)와 같은 구조다.
 *
 * 목록(features/catalog)과 채팅 추천 카드(features/chat)가 같이 써서 entities 에 둔다.
 */
export default function AddOnDetailModal({
  addOn,
  onClose,
  onJoin,
}: AddOnDetailModalProps) {
  return (
    <FullModal
      isOpen={addOn !== null}
      onClose={onClose}
      ariaLabel={addOn ? `${addOn.title} 상세` : '부가서비스 상세'}
    >
      {addOn && (
        <div className="px-4 pt-5 pb-6">
          <div className="rounded-md bg-background-default p-4 shadow-default">
            <AddOnDetailCard addOn={addOn} onJoin={() => onJoin(addOn)} />
          </div>
        </div>
      )}
    </FullModal>
  );
}
