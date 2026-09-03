'use client';

import FullModal from '@/shared/ui/FullModal';

import SubscriptionDetailCard from '@/entities/subscription/ui/SubscriptionDetailCard';
import type { Subscription } from '@/entities/subscription/types';

interface SubscriptionDetailModalProps {
  /** 열려 있는 구독 상품. null 이면 모달이 닫힌 상태 */
  subscription: Subscription | null;
  onClose: () => void;
  /** DATA-015: 상세에서 바로 가입으로 이어지는 자리 */
  onJoin: (subscription: Subscription) => void;
}

/**
 * DATA-014: 목록에서 구독 상품 하나를 눌렀을 때 화면을 덮으며 들어오는 상세.
 * 바닥과 헤더는 FullModal 이 깔고, 이 화면은 그 위에 올릴 카드 한 장을 맡는다 -
 * 요금제·부가서비스 상세와 같은 구조다.
 *
 * 목록(features/catalog)과 채팅 추천 카드(features/chat)가 같이 써서 entities 에 둔다.
 */
export default function SubscriptionDetailModal({
  subscription,
  onClose,
  onJoin,
}: SubscriptionDetailModalProps) {
  return (
    <FullModal
      isOpen={subscription !== null}
      onClose={onClose}
      ariaLabel={subscription ? `${subscription.name} 상세` : '구독 상품 상세'}
    >
      {subscription && (
        <div className="px-4 pt-5 pb-6">
          <div className="rounded-md bg-background-default p-4 shadow-default">
            <SubscriptionDetailCard
              subscription={subscription}
              onJoin={() => onJoin(subscription)}
            />
          </div>
        </div>
      )}
    </FullModal>
  );
}
