import { Smartphone } from 'lucide-react';

import UsageSnapshotCard from '@/entities/usage/ui/UsageSnapshotCard';

import { parseDataAllowanceToGb } from '@/entities/plan/lib/format';
import type { UserProfile } from '@/entities/user/types';

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

/**
 * PERSONAL-004: 현재 요금제와 이번 달 남은 사용량.
 *
 * 값은 전부 users 와 plans 에서 읽은 실제 데이터다 - 화면에서 지어내지 않는다.
 * 실제 카드 표현은 entities/usage의 UsageSnapshotCard(채팅 사용량 분석 카드와
 * 공용)가 맡는다 - features/usage와 features/mypage가 서로 직접 참조할 수
 * 없어서 entities로 승격한 것. 여기서는 UserProfile을 그 컴포넌트가 받는
 * 모양(가공된 값)으로 변환하는 것만 담당한다.
 */
export default function UsageSummaryCard({
  profile,
  billingMonth,
}: UsageSummaryCardProps) {
  const { currentPlan, remainingDataGb } = profile;

  if (!currentPlan) {
    return (
      <section className="flex flex-col gap-1 rounded-md bg-background-default p-4 shadow-default">
        <h2 className="flex items-center gap-2 text-14 font-medium text-text-primary">
          <Smartphone size={20} strokeWidth={1.5} aria-hidden />
          사용량 분석
        </h2>
        <p className="text-12 text-text-secondary">가입한 요금제가 없어요.</p>
      </section>
    );
  }

  /*
    데이터 제공량은 users.data_limit 이 아니라 지금 가입된 요금제에서 읽는다.
    요금제를 바꿔도 users.data_limit 은 그대로 남아(가입 완료가 current_plan_id 만
    갱신한다) 옛 요금제 기준 숫자가 계속 보이기 때문이다. 화면에 보이는 값은
    "지금 쓰는 요금제"와 어긋나면 안 된다.
  */
  const planDataGb = parseDataAllowanceToGb(currentPlan.dataAllowance);
  const isUnlimitedData = planDataGb === Number.POSITIVE_INFINITY;
  const totalDataGb = Number.isFinite(planDataGb) ? planDataGb : null;

  // 제공량이 줄어드는 요금제로 바꾸면 남은 양이 제공량을 넘을 수 있다
  const remainingGb =
    totalDataGb !== null ? Math.min(remainingDataGb, totalDataGb) : remainingDataGb;

  // UsageSnapshotCard(채팅 사용량 분석과 공용)와 같은 기준 - "얼마나 남았는지"를 강조한다.
  const remainingPercentage =
    totalDataGb && totalDataGb > 0
      ? Math.min(100, Math.max(0, Math.round((remainingGb / totalDataGb) * 100)))
      : 100;

  const voiceSms = toSummaryVoiceSms(currentPlan.voiceSms);

  return (
    <UsageSnapshotCard
      currentPlanName={currentPlan.name}
      currentPlanPrice={currentPlan.monthlyFee}
      billingMonth={billingMonth}
      dataRemaining={
        isUnlimitedData || totalDataGb === null
          ? '무제한'
          : `${remainingGb}GB / ${totalDataGb}GB`
      }
      voiceRemaining={voiceSms.call}
      smsRemaining={voiceSms.sms}
      remainingPercentage={remainingPercentage}
      isUnlimitedData={isUnlimitedData}
      // 마이페이지에서는 채팅 말풍선 폭 제한(440px)이 아니라, 페이지 컨테이너
      // 폭을 그대로 채운다 - tailwind-merge가 기존 w-[min(80%,440px)]를 이걸로 덮는다.
      appendClassName="w-full"
    />
  );
}
