import {
  Gauge,
  PhoneCall,
  Share2,
  Wifi,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';

import Button from '@/shared/ui/Button';
import Tag from '@/shared/ui/Tag';

import { cn } from '@/shared/utils/cn';
import { formatWon } from '@/shared/utils/formatCurrency';
import { parseDataAllowance, parseVoiceSms } from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';

interface PlanCardProps {
  plan: Plan;
  // 추천 순위
  rank?: number;
  // 연간 절감액
  annualSavings?: number;
  onViewDetail?: () => void;
  onJoin?: () => void;
  /** 배치 전용 탈출구 (w-full 등). 색상 등 디자인은 이 컴포넌트가 고정한다 */
  appendClassName?: string;
}

function PlanFeatureRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex items-center gap-1.5 text-10 text-text-primary">
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
  appendClassName,
}: PlanCardProps) {
  const { amount: dataAmount, throttleSpeed } = parseDataAllowance(
    plan.dataAllowance,
  );
  const { call, sms } = parseVoiceSms(plan.voiceSms);
  const tetheringSharing = plan.benefits?.tethering_sharing;

  return (
    <div
      className={cn(
        'flex w-[80%] flex-col gap-2 rounded-md bg-background-default p-4 shadow-default',
        appendClassName,
      )}
    >
      {rank !== undefined && (
        <Tag appendClassName="self-start">추천 {rank}위</Tag>
      )}

      <div className="flex items-end justify-between gap-2">
        <h3 className="text-14 font-medium text-text-primary">{plan.name}</h3>
        <p className="text-14 text-action-primary">
          월 {formatWon(plan.monthlyFee)}
        </p>
      </div>

      <ul className="flex flex-col gap-1">
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
        {/* 쉐어링 - 값을 없을 때 숨김 */}
        {tetheringSharing && (
          <PlanFeatureRow
            icon={
              <Share2 size={14} className="text-action-secondary" aria-hidden />
            }
            label={`쉐어링 ${tetheringSharing}`}
          />
        )}
      </ul>

      {annualSavings !== undefined && annualSavings > 0 && (
        <div className="flex items-center justify-start gap-2 rounded-sm bg-[#FFF6DD] px-2 py-1.5 text-[#DEA80F]">
          <Lightbulb size={14} className="shrink-0" aria-hidden />
          <p className="text-10 font-medium">
            기존 요금제 대비 연간 {formatWon(annualSavings)}원 절약!
          </p>
        </div>
      )}

      <div className="flex gap-1">
        <Button
          variant="outline"
          radius="full"
          onClick={onViewDetail}
          appendClassName="flex-8"
        >
          상세보기
        </Button>
        <Button
          variant="main"
          radius="full"
          onClick={onJoin}
          appendClassName="flex-17"
        >
          신청하기
        </Button>
      </div>
    </div>
  );
}
