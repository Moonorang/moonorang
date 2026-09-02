import { Gauge, MessageCircle, PhoneCall, Share2, Wifi } from 'lucide-react';

import Button from '@/shared/ui/Button';

import BenefitRow from '@/entities/plan/ui/BenefitRow';

import { formatWon } from '@/shared/utils/formatCurrency';
import { getPlanBenefitDetail } from '@/entities/plan/config/planBenefits';
import { parseDataAllowance, parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';

interface PlanDetailCardProps {
  plan: Plan;
  /**
   * 가입 절차로 들어가는 버튼의 동작.
   * 넘기지 않으면 버튼 자체를 그리지 않는다 - 이미 가입 절차 안이라면
   * 같은 버튼이 한 번 더 나올 이유가 없다.
   */
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

/**
 * 요금제 하나를 펼쳐 보여주는 상세 내용.
 * 대화 말풍선 안(features/chat), 가입 절차 안(features/join),
 * 목록의 상세(features/catalog) 여러 곳에서 쓰므로
 * 폭·배경·바깥 여백은 감싸는 쪽이 정하고 여기서는 안쪽 간격만 갖는다.
 */
export default function PlanDetailCard({ plan, onJoin }: PlanDetailCardProps) {
  const { amount: dataAmount, throttleSpeed } = parseDataAllowance(
    plan.dataAllowance,
  );
  const { call, sms } = parseVoiceSms(plan.voiceSms);
  const tetheringSharing = plan.benefits?.tethering_sharing;
  const { mainBenefits, addOnServices } = getPlanBenefitDetail(plan.id);

  return (
    <div className="flex flex-col">
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

      {/* 시안의 높이 38px 은 size="lg"(py-2.5 + text-12)가 그대로 만들어 준다 */}
      {onJoin && (
        <Button
          variant="main"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onJoin}
          appendClassName="mt-[18px]"
        >
          채팅에서 신청하기
        </Button>
      )}

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
