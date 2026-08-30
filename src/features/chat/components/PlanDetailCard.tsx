import { Gauge, MessageCircle, PhoneCall, Share2, Wifi } from 'lucide-react';

import Button from '@/shared/ui/Button';

import BenefitRow from '@/features/chat/components/BenefitRow';
import { getPlanBenefitDetail } from '@/features/chat/data/planBenefits';

import { formatWon } from '@/shared/utils/formatCurrency';
import { parseDataAllowance, parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';

interface PlanDetailCardProps {
  plan: Plan;
  // 약관 동의 단계는 아직 없다. 붙는 시점에 이 자리로 넘긴다
  onJoin?: () => void;
}

function PlanFeatureRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  // 시안의 행 간격 18px 은 글자 줄 높이(12px x 1.5)와 같아서 gap 없이 높이로 준다.
  // 카드 폭을 말풍선에 맞추면서 긴 문구가 두 줄이 될 수 있어 최소 높이로 준다
  return (
    <li className="flex min-h-[18px] items-center gap-1.5 text-12 text-text-primary">
      {icon}
      {label}
    </li>
  );
}

/** 신청하기를 눌렀을 때 대화에 쌓이는 요금제 상세 카드 */
export default function PlanDetailCard({ plan, onJoin }: PlanDetailCardProps) {
  const { amount: dataAmount, throttleSpeed } = parseDataAllowance(
    plan.dataAllowance,
  );
  const { call, sms } = parseVoiceSms(plan.voiceSms);
  const tetheringSharing = plan.benefits?.tethering_sharing;
  const { mainBenefits, addOnServices } = getPlanBenefitDetail(plan.id);

  return (
    <div className="flex w-[80%] flex-col rounded-md bg-background-default p-4">
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-14 font-medium text-text-primary">{plan.name}</h3>
        <p className="text-14 text-action-primary">
          월 {formatWon(plan.monthlyFee)}
        </p>
      </div>

      <ul className="mt-[5px] flex flex-col">
        <PlanFeatureRow
          icon={<Wifi size={14} className="text-action-primary" aria-hidden />}
          label={dataAmount}
        />
        <PlanFeatureRow
          icon={<PhoneCall size={14} className="text-accent-1" aria-hidden />}
          label={call}
        />
        {/* 소진 시 속도 - 값이 없을 때 숨김 */}
        {throttleSpeed && (
          <PlanFeatureRow
            icon={<Gauge size={14} className="text-accent-2" aria-hidden />}
            label={`소진 시 ${throttleSpeed}`}
          />
        )}
        <PlanFeatureRow
          icon={
            <MessageCircle size={14} className="text-accent-3" aria-hidden />
          }
          label={sms}
        />
        {/* 쉐어링 - 값이 없을 때 숨김 */}
        {tetheringSharing && (
          <PlanFeatureRow
            icon={
              <Share2 size={14} className="text-action-secondary" aria-hidden />
            }
            label={`쉐어링 ${tetheringSharing}`}
          />
        )}
      </ul>

      {/* 시안의 높이 38px 을 맞추려면 기본 padding(py-2)과 글자 크기(text-10)를 덮어야 한다 */}
      <Button
        variant="main"
        radius="sm"
        onClick={onJoin}
        className="mt-[18px] w-full py-2.5 text-12 font-medium"
      >
        신청하기
      </Button>

      {mainBenefits.length > 0 && (
        <>
          <h4 className="mt-[18px] text-12 font-medium text-text-primary">
            주요 혜택
          </h4>
          <ul className="mt-2.5 flex flex-col gap-2">
            {mainBenefits.map((benefit) => (
              <BenefitRow key={benefit.title} {...benefit} />
            ))}
          </ul>
        </>
      )}

      {addOnServices.length > 0 && (
        <>
          <h4 className="mt-[18px] text-12 font-medium text-text-primary">
            추가 서비스
          </h4>
          <ul className="mt-2.5 flex flex-col gap-2">
            {addOnServices.map((service) => (
              <BenefitRow key={service.title} {...service} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
