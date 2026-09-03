import {
  CircleDollarSign,
  MessageCircle,
  PhoneCall,
  Smartphone,
  Wifi,
} from 'lucide-react';

import UsageDonut from '@/features/mypage/components/UsageDonut';

import { parseDataAllowanceToGb } from '@/entities/plan/lib/format';
import type { UserProfile } from '@/entities/user/types';

import { formatWon } from '@/shared/utils/formatCurrency';

interface UsageSummaryCardProps {
  profile: UserProfile;
  /** 이용 요금이 어느 달 것인지 (예: 8) */
  billingMonth: number;
}

/**
 * 한 줄 칸에 들어갈 음성·문자 제공 조건.
 *
 * entities/plan 의 parseVoiceSms 를 안 쓰는 이유는, 그쪽이 부가통화까지 이어 붙여
 * 돌려주기 때문이다(예: '기본제공 + 부가통화 300분 무료'). 이 칸은 한 줄짜리
 * 요약이라 그 길이가 들어가면 두 줄로 접힌다 - 여기서는 앞의 제공 조건만 쓴다.
 */
function toSummaryVoiceSms(raw: string): { call: string; sms: string } {
  const [call, sms] = raw.split('/').map((part) => part.trim());

  return { call: call || '-', sms: sms || '-' };
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
    // 값이 길어도 두 줄로 접히지 않게 - 라벨은 폭을 지키고 값만 줄어든다
    <div
      className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-12 font-medium ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="shrink-0">{label}</span>
      <span className="ml-auto min-w-0 truncate">{value}</span>
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
  const { currentPlan, remainingDataGb } = profile;

  /*
    데이터 제공량은 users.data_limit 이 아니라 지금 가입된 요금제에서 읽는다.
    요금제를 바꿔도 users.data_limit 은 그대로 남아(가입 완료가 current_plan_id 만
    갱신한다) 옛 요금제 기준 숫자가 계속 보이기 때문이다. 화면에 보이는 값은
    "지금 쓰는 요금제"와 어긋나면 안 된다.
  */
  const planDataGb = currentPlan
    ? parseDataAllowanceToGb(currentPlan.dataAllowance)
    : null;
  const isUnlimitedData = planDataGb === Number.POSITIVE_INFINITY;
  const totalDataGb =
    planDataGb !== null && Number.isFinite(planDataGb) ? planDataGb : null;

  // 제공량이 줄어드는 요금제로 바꾸면 남은 양이 제공량을 넘을 수 있다
  const remainingGb =
    totalDataGb !== null
      ? Math.min(remainingDataGb, totalDataGb)
      : remainingDataGb;

  // 제공량을 아는 요금제일 때만 비율이 나온다
  const usedPercent =
    totalDataGb && totalDataGb > 0
      ? ((totalDataGb - remainingGb) / totalDataGb) * 100
      : null;

  const voiceSms = currentPlan
    ? toSummaryVoiceSms(currentPlan.voiceSms)
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
            value={
              isUnlimitedData || totalDataGb === null
                ? '무제한'
                : `${remainingGb}GB / ${totalDataGb}GB`
            }
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
