'use client';

import Modal from '@/shared/ui/FullModal';

import PlanDetailCard from '@/entities/plan/ui/PlanDetailCard';
import type { Plan } from '@/entities/plan/types';

interface PlanDetailModalProps {
  /** 열려 있는 요금제. null 이면 모달이 닫힌 상태 */
  plan: Plan | null;
  onClose: () => void;
  /** DATA-004: 상세에서 바로 가입으로 이어지는 자리 */
  onJoin: (plan: Plan) => void;
}

/**
 * DATA-003: 목록에서 요금제 하나를 눌렀을 때 화면을 덮으며 들어오는 상세.
 * 별도 라우트가 아니라 모달인 이유는, 닫으면 보던 목록의 스크롤 위치로
 * 그대로 돌아와야 하기 때문이다.
 *
 * 바닥과 헤더는 Modal 이 깔고, 이 화면은 그 위에 올릴 카드 한 장을 맡는다.
 *
 * 목록(features/catalog)과 채팅 추천 카드(features/chat)가 같이 써서 entities 에 둔다.
 */
export default function PlanDetailModal({
  plan,
  onClose,
  onJoin,
}: PlanDetailModalProps) {
  return (
    <Modal
      isOpen={plan !== null}
      onClose={onClose}
      ariaLabel={plan ? `${plan.name} 상세` : '요금제 상세'}
    >
      {plan && (
        <div className="px-4 pt-5 pb-6">
          <div className="rounded-md bg-background-default p-4 shadow-default">
            <PlanDetailCard plan={plan} onJoin={() => onJoin(plan)} />
          </div>
        </div>
      )}
    </Modal>
  );
}
