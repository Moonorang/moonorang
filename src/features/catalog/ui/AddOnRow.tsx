import CatalogCard from '@/features/catalog/ui/CatalogCard';

import {
  ADD_ON_ICON_FALLBACK,
  ADD_ON_ICONS,
} from '@/features/catalog/constants';
import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
import type { AddOn } from '@/entities/addOn/types';

interface AddOnRowProps {
  addOn: AddOn;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-008: 부가서비스명·월 요금·혜택
export default function AddOnRow({ addOn }: AddOnRowProps) {
  const { description } = addOn;
  // const hasDetail = !!description?.guide || !!description?.features?.length;
  // description.icon 값에 맞는 아이콘 (표에 없으면 기본 아이콘)
  const Icon = ADD_ON_ICONS[description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;

  // 임시 처리
  const handleCardClick = () => {
    alert(`${addOn.title} 상세`);
  };

  return (
    <CatalogCard
    // 펼침 버튼 대신 카드 전체 클릭으로 대체 (임시)
    // expandSummary={hasDetail ? '서비스 상세 안내' : undefined}
    // isExpanded={isExpanded}
    // onToggle={onToggle}
    // detail={
    //   hasDetail ? (
    //     <div className="flex flex-col gap-2">
    //       {description?.guide && (
    //         <p className="text-12 text-text-primary">{description.guide}</p>
    //       )}
    //       {!!description?.features?.length && (
    //         <ul className="flex list-disc flex-col gap-1 pl-4">
    //           {description.features.map((feature) => (
    //             <li key={feature} className="text-12 text-text-secondary">
    //               {feature}
    //             </li>
    //           ))}
    //         </ul>
    //       )}
    //     </div>
    //   ) : undefined
    // }
    >
      <button
        type="button"
        onClick={handleCardClick}
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
