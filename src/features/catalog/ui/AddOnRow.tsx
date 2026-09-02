import CatalogCard from '@/features/catalog/ui/CatalogCard';

import {
  ADD_ON_ICON_FALLBACK,
  ADD_ON_ICONS,
} from '@/features/catalog/constants';
import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
import type { AddOn } from '@/entities/addOn/types';

interface AddOnRowProps {
  addOn: AddOn;
  /** DATA-009: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-008: 부가서비스명·월 요금·혜택
export default function AddOnRow({ addOn, onSelect }: AddOnRowProps) {
  const { description } = addOn;
  // description.icon 값에 맞는 아이콘 (표에 없으면 기본 아이콘)
  const Icon = ADD_ON_ICONS[description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-1 cursor-pointer flex-col justify-between px-4 py-3 text-left"
      >
        <div className="flex w-full items-center gap-2">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-border-default">
            <Icon
              size={16}
              strokeWidth={1.5}
              className="text-text-primary"
              aria-hidden
            />
          </span>
          <p className="min-w-0 truncate text-12 font-medium text-text-primary">
            {addOn.title}
          </p>
        </div>

        <p className="text-10 leading-relaxed text-text-primary">
          {description?.guide ?? addOn.subTitle}
        </p>

        <p className="text-10 font-medium text-action-primary">
          {formatMonthlyFee(addOn.baseMonthlyRate)}
        </p>
      </button>
    </CatalogCard>
  );
}
