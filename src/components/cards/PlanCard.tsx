import {
  Gauge,
  PhoneCall,
  Share2,
  Wifi,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';

import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';

import { cn } from '@/utils/cn';
import { formatWon } from '@/utils/formatCurrency';
import { parseDataAllowance, parseVoiceSms } from '@/utils/planFormat';
import type { Plan } from '@/types/plan';

interface PlanCardProps {
  plan: Plan;
  // 추천 순위
  rank?: number;
  // 연간 절감액
  annualSavings?: number;
  onViewDetail?: () => void;
  onJoin?: () => void;
  className?: string;
}

function PlanFeatureRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 text-12 text-text-main">
      {icon}
      {label}
    </li>
  );
}

export default function PlanCard({
  plan,
  rank,
  annualSavings,
  onViewDetail,
  onJoin,
  className,
}: PlanCardProps) {
  const { amount: dataAmount, throttleSpeed } = parseDataAllowance(
    plan.dataAllowance,
  );
  const { call, sms } = parseVoiceSms(plan.voiceSms);
  const tetheringSharing = plan.benefits?.tethering_sharing;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 rounded-md bg-neutral-pure-white p-4',
        className,
      )}
    >
      {rank !== undefined && <Tag className="self-start">추천 {rank}위</Tag>}

      <div className="flex items-end justify-between gap-2">
        <h3 className="text-16 font-semibold text-text-main">{plan.name}</h3>
        <p className="text-16 font-semibold text-primary-red">
          월 {formatWon(plan.monthlyFee)}
        </p>
      </div>

      <ul className="flex flex-col gap-1">
        <PlanFeatureRow
          icon={<Wifi size={14} className="text-primary-red" aria-hidden />}
          label={dataAmount}
        />
        <PlanFeatureRow
          icon={
            <PhoneCall size={14} className="text-primary-green" aria-hidden />
          }
          label={call}
        />
        {/* 속도 - 값이 없을 때 숨김 */}
        {throttleSpeed && (
          <PlanFeatureRow
            icon={
              <Gauge size={14} className="text-secondary-blue" aria-hidden />
            }
            label={`속도 ${throttleSpeed}`}
          />
        )}
        <PlanFeatureRow
          icon={
            <MessageCircle
              size={14}
              className="text-primary-pink"
              aria-hidden
            />
          }
          label={sms}
        />
        {/* 쉐어링 - 값을 없을 때 숨김 */}
        {tetheringSharing && (
          <PlanFeatureRow
            icon={
              <Share2 size={14} className="text-primary-yellow" aria-hidden />
            }
            label={`쉐어링 ${tetheringSharing}`}
          />
        )}
      </ul>

      {annualSavings !== undefined && annualSavings > 0 && (
        <div className="flex items-center justify-start gap-1 rounded-sm bg-[#FFF6DD] px-2 py-1.5 text-[#DEA80F]">
          <Lightbulb size={14} className="shrink-0" aria-hidden />
          <p className="text-10 font-medium">
            기존 요금제 대비 연간 {formatWon(annualSavings)}원 절약!
          </p>
        </div>
      )}

      <div className="flex gap-1">
        <Button
          variant="main"
          radius="full"
          onClick={onViewDetail}
          className="flex-1 font-medium"
        >
          상세보기
        </Button>
        <Button
          variant="gradient"
          radius="full"
          onClick={onJoin}
          className="flex-3 font-medium"
        >
          이 요금제로 가입하기
        </Button>
      </div>
    </div>
  );
}
