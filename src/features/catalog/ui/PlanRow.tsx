import CatalogCard from '@/features/catalog/ui/CatalogCard';
import ExpandToggle from '@/features/catalog/ui/ExpandToggle';
// import DetailRow from '@/features/catalog/ui/DetailRow';

import { isMeaningful } from '@/features/catalog/lib/isMeaningful';
import { formatWon } from '@/shared/utils/formatCurrency';
import { parseDataAllowance } from '@/entities/plan/lib/format';
// import { parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';

interface PlanRowProps {
  plan: Plan;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-002: 요금제명·월 요금·데이터·음성·문자·부가 혜택
export default function PlanRow({ plan }: PlanRowProps) {
  const { amount } = parseDataAllowance(plan.dataAllowance);
  // const { throttleSpeed } = parseDataAllowance(plan.dataAllowance);
  // const { call, sms } = parseVoiceSms(plan.voiceSms);
  const tetheringSharing = plan.benefits?.tethering_sharing;
  const maxBenefitValue = plan.benefits?.max_benefit_value;
  // const mediaContents = plan.benefits?.media_contents;
  // const vipMembership = plan.benefits?.vip_membership;

  // TODO: 상세 화면 연결 전까지 임시 처리
  const handleCardClick = () => {
    alert(`${plan.name} 상세`);
  };

  return (
    <CatalogCard
    // 펼침 버튼 대신 카드 전체 클릭으로 대체 (임시)
    // isExpanded={isExpanded}
    // onToggle={onToggle}
    // expandSummary={
    //   isMeaningful(maxBenefitValue)
    //     ? `최대 ${maxBenefitValue} 상당 혜택`
    //     : undefined
    // }
    // detail={
    //   <dl>
    //     <DetailRow label="데이터" value={plan.dataAllowance} />
    //     {throttleSpeed && <DetailRow label="소진 후" value={throttleSpeed} />}
    //     <DetailRow label="음성 통화" value={call} />
    //     {sms && <DetailRow label="문자" value={sms} />}
    //     {tetheringSharing && (
    //       <DetailRow label="테더링·쉐어링" value={tetheringSharing} />
    //     )}
    //     {isMeaningful(mediaContents) && (
    //       <DetailRow label="미디어 혜택" value={mediaContents} />
    //     )}
    //     {isMeaningful(vipMembership) && (
    //       <DetailRow label="멤버십 혜택" value={vipMembership} />
    //     )}
    //   </dl>
    // }
    >
      <button
        type="button"
        onClick={handleCardClick}
        className="flex w-full cursor-pointer flex-col text-left"
      >
        <div className="flex w-full items-center gap-3 px-4 pt-5 pb-2">
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
          <ExpandToggle summary={`최대 ${maxBenefitValue} 상당 혜택`} />
        )}
      </button>
    </CatalogCard>
  );
}
