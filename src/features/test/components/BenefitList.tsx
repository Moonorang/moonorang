import { MonitorPlay, ShieldCheck, Ticket, Wifi } from 'lucide-react';

import type { BenefitIcon, TestBenefit } from '@/features/test/types';

// 혜택 아이콘 종류별 아이콘과 배경색
// #FFEAAD 는 globals.css 에 없어 가장 가까운 action-secondary-light 로 대체함
const BENEFIT_STYLES: Record<
  BenefitIcon,
  { icon: typeof Wifi; className: string }
> = {
  monitor: {
    icon: MonitorPlay,
    className: 'bg-action-secondary-light text-action-secondary',
  },
  wifi: {
    icon: Wifi,
    className: 'bg-accent-1-light text-accent-1',
  },
  shield: {
    icon: ShieldCheck,
    className: 'bg-accent-2-light text-accent-2',
  },
  // 쿠폰·할인처럼 "받아서 쓰는" 혜택. 결과 화면 세 줄이 서로 다른 아이콘을
  // 갖도록 넷째 종류로 더했다.
  ticket: {
    icon: Ticket,
    className: 'bg-action-primary-light text-action-primary',
  },
};

interface BenefitListProps {
  benefits: TestBenefit[];
}

/** TEST-007: 진단된 유형에 딸린 맞춤 혜택 목록 */
export default function BenefitList({ benefits }: BenefitListProps) {
  return (
    <>
      {benefits.map((benefit) => {
        const { icon: Icon, className } = BENEFIT_STYLES[benefit.icon];

        return (
          <div
            key={benefit.title}
            className="flex items-center gap-2 rounded-md bg-background-default p-4"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${className}`}
            >
              <Icon size={16} aria-hidden />
            </span>
            <div className="flex flex-col">
              <p className="text-12 font-medium text-text-primary">
                {benefit.title}
              </p>
              <p className="text-10 font-medium text-text-secondary">
                {benefit.description}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
