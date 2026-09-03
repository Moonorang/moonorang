import Image from 'next/image';

import BenefitSummary from '@/features/catalog/ui/BenefitSummary';

import { isMeaningful } from '@/features/catalog/lib/isMeaningful';
import { parseDataAllowance } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';
import CatalogCard from '@/shared/ui/CatalogCard';
import { CATALOG_IMAGE_BASE_PATH } from '@/shared/utils/catalogImagePath';
import { formatWon } from '@/shared/utils/formatCurrency';

interface PlanRowProps {
  plan: Plan;
  /** DATA-003: 카드를 누르면 상세 모달을 연다 */
  onSelect: () => void;
}

// DATA-002: 요금제명·월 요금·데이터·음성·문자·부가 혜택
export default function PlanRow({ plan, onSelect }: PlanRowProps) {
  const { amount } = parseDataAllowance(plan.dataAllowance);
  const tetheringSharing = plan.benefits?.tethering_sharing;
  const maxBenefitValue = plan.benefits?.max_benefit_value;
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${plan.image}`;

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-1 cursor-pointer flex-col text-left"
      >
        <div className="flex w-full flex-1 items-center gap-3 px-4 pt-5 pb-2">
          <Image
            src={imageSrc}
            alt={plan.name}
            width={300}
            height={174}
            className="h-9 w-auto shrink-0 rounded-md object-contain"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-12 font-medium text-text-primary">
              데이터 {amount}
            </p>
            {tetheringSharing && (
              <p className="truncate text-10 text-text-primary">
                테더링 + 쉐어링 {tetheringSharing}
              </p>
            )}
          </div>

          <p className="shrink-0 text-14 font-semibold text-action-primary">
            월 {formatWon(plan.monthlyFee)} 원
          </p>
        </div>

        {isMeaningful(maxBenefitValue) && (
          <BenefitSummary summary={`최대 ${maxBenefitValue} 상당 혜택`} />
        )}
      </button>
    </CatalogCard>
  );
}
