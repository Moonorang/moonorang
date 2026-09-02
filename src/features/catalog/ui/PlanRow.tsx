import CatalogCard from '@/features/catalog/ui/CatalogCard';
import BenefitSummary from '@/features/catalog/ui/BenefitSummary';

import { isMeaningful } from '@/features/catalog/lib/isMeaningful';
import { formatWon } from '@/shared/utils/formatCurrency';
import { parseDataAllowance } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';

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

  return (
    <CatalogCard>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-1 cursor-pointer flex-col text-left"
      >
        <div className="flex w-full flex-1 items-center gap-3 px-4 pt-5 pb-2">
          <p className="w-14 shrink-0 pl-1 text-14 font-medium text-text-primary">
            {plan.name}
          </p>

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
