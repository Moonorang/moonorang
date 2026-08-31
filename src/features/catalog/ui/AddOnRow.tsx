import CatalogCard from '@/features/catalog/ui/CatalogCard';

import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
import type { AddOn } from '@/entities/addOn/types';

interface AddOnRowProps {
  addOn: AddOn;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-008: 부가서비스명·월 요금·혜택
export default function AddOnRow({
  addOn,
  isExpanded,
  onToggle,
}: AddOnRowProps) {
  const { description } = addOn;
  const hasDetail = !!description?.guide || !!description?.features?.length;

  return (
    <CatalogCard
      expandSummary={hasDetail ? '서비스 상세 안내' : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
      detail={
        hasDetail ? (
          <div className="flex flex-col gap-2">
            {description?.guide && (
              <p className="text-12 text-text-primary">{description.guide}</p>
            )}
            {!!description?.features?.length && (
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {description.features.map((feature) => (
                  <li key={feature} className="text-12 text-text-secondary">
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-14 font-semibold text-text-primary">
            {addOn.title}
          </p>
          <p className="truncate text-12 text-text-secondary">
            {addOn.subTitle}
          </p>
        </div>

        <p className="shrink-0 text-14 font-semibold text-action-primary">
          {formatMonthlyFee(addOn.baseMonthlyRate)}
        </p>
      </div>
    </CatalogCard>
  );
}
