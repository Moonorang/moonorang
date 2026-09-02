import {
  CircleDollarSign,
  MessageCircle,
  PhoneCall,
  Smartphone,
  Wifi,
} from 'lucide-react';

import UsageDonut from '@/features/mypage/components/UsageDonut';

import { parseVoiceSms } from '@/entities/plan/lib/format';
import type { UserProfile } from '@/entities/user/types';

import { formatWon } from '@/shared/utils/formatCurrency';

interface UsageSummaryCardProps {
  profile: UserProfile;
  /** 이용 요금이 어느 달 것인지 (예: 8) */
  billingMonth: number;
}

/** 남은 사용량 한 줄 - 색만 다르고 모양은 같다 */
function RemainingRow({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-12 font-medium ${className}`}
    >
      {icon}
      <span>{label}</span>
      <span className="ml-auto">{value}</span>
    </div>
  );
}

/**
 * PERSONAL-004: 현재 요금제와 이번 달 남은 사용량.
 *
 * 값은 전부 users 와 plans 에서 읽은 실제 데이터다 - 화면에서 지어내지 않는다.
 * 무제한 요금제는 쓴 비율을 낼 수 없어서 링 대신 '무제한'으로 표시한다.
 */
export default function UsageSummaryCard({
  profile,
  billingMonth,
}: UsageSummaryCardProps) {
  const { currentPlan, remainingDataGb, dataLimitGb } = profile;

  // 제공량을 아는 요금제일 때만 비율이 나온다
  const usedPercent =
    dataLimitGb && dataLimitGb > 0
      ? ((dataLimitGb - remainingDataGb) / dataLimitGb) * 100
      : null;

  const voiceSms = currentPlan
    ? parseVoiceSms(currentPlan.voiceSms)
    : { call: '-', sms: '-' };

  return (
    <section className="flex flex-col rounded-md bg-background-default p-4 shadow-default">
      <h2 className="flex items-center gap-2 text-14 font-medium text-text-primary">
        <Smartphone size={20} strokeWidth={1.5} aria-hidden />
        사용량 분석
      </h2>

      {/* 현재 요금제 + 이번 달 요금 */}
      <div className="mt-4 flex items-end justify-between gap-2 rounded-md bg-background-subtle p-4">
        <div className="flex flex-col gap-1">
          <p className="text-12 font-medium text-text-secondary">현재 요금제</p>
          <p className="text-14 text-text-primary">
            {currentPlan?.name ?? '가입한 요금제 없음'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="flex items-center gap-1 text-12 font-medium text-text-secondary">
            <CircleDollarSign size={14} strokeWidth={1.5} aria-hidden />
            {billingMonth}월 이용 요금
          </p>
          <p className="text-14 text-action-primary">
            {currentPlan ? `${formatWon(currentPlan.monthlyFee)}원` : '-'}
          </p>
        </div>
      </div>

      {/* 남은 사용량 */}
      <div className="mt-4 flex items-center gap-4 rounded-md bg-background-subtle p-4">
        <UsageDonut usedPercent={usedPercent} />

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-14 font-medium text-text-primary">남은 사용량</h3>

          <RemainingRow
            icon={<Wifi size={14} strokeWidth={1.5} aria-hidden />}
            label="데이터"
            value={dataLimitGb ? `${remainingDataGb}GB` : '무제한'}
            className="bg-accent-2-light text-accent-2"
          />
          {/* 시안의 #F6FBEA 는 토큰에 없어 가장 가까운 accent-1-light 로 대체함 */}
          <RemainingRow
            icon={<PhoneCall size={14} strokeWidth={1.5} aria-hidden />}
            label="음성"
            value={voiceSms.call}
            className="bg-accent-1-light text-accent-1"
          />
          <RemainingRow
            icon={<MessageCircle size={14} strokeWidth={1.5} aria-hidden />}
            label="SMS"
            value={voiceSms.sms}
            className="bg-action-secondary-light text-action-secondary"
          />
        </div>
      </div>
    </section>
  );
}
