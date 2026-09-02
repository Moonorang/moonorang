'use client';

import Button from '@/shared/ui/Button';
import FullModal from '@/shared/ui/FullModal';

import {
  ADD_ON_ICON_FALLBACK,
  ADD_ON_ICONS,
} from '@/features/catalog/constants';
import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
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
 */
export default function AddOnDetailModal({
  addOn,
  onClose,
  onJoin,
}: AddOnDetailModalProps) {
  // description.icon 값에 맞는 아이콘 (표에 없으면 기본 아이콘)
  const Icon =
    ADD_ON_ICONS[addOn?.description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;
  const features = addOn?.description?.features ?? [];

  return (
    <FullModal
      isOpen={addOn !== null}
      onClose={onClose}
      ariaLabel={addOn ? `${addOn.title} 상세` : '부가서비스 상세'}
    >
      {addOn && (
        <div className="px-4 pt-5 pb-6">
          <div className="flex flex-col rounded-md bg-background-default p-4 shadow-default">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full border border-border-default">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className="text-text-primary"
                  aria-hidden
                />
              </span>
              <h3 className="min-w-0 truncate text-12 font-medium text-text-primary">
                {addOn.title}
              </h3>
            </div>

            <p className="mt-2 text-10 leading-fixed text-text-primary">
              {addOn.description?.guide ?? addOn.subTitle}
            </p>

            {/* DATA-012: 일할 계산 기준액이라 '월 요금'이 아니라 기준 금액으로 읽힌다 */}
            <p className="mt-2 text-10 font-medium text-action-primary">
              {formatMonthlyFee(addOn.baseMonthlyRate)}
            </p>

            <hr className="mt-2 border-border-default" />

            {features.length > 0 && (
              <>
                <h4 className="mt-3 text-12 font-medium text-text-primary">
                  서비스 상세
                </h4>
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="text-10 leading-fixed text-text-secondary"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Button
              variant="main"
              radius="sm"
              size="lg"
              isFullWidth
              onClick={() => onJoin(addOn)}
              appendClassName="mt-5"
            >
              채팅에서 가입하기
            </Button>
          </div>
        </div>
      )}
    </FullModal>
  );
}
