import { MonitorPlay, ShieldCheck, Wifi } from 'lucide-react';

import type { BenefitIcon, TestBenefit } from '@/features/test/types';

// 혜택 아이콘 종류별 아이콘과 배경색
// #FFEAAD 는 globals.css 에 없어 가장 가까운 secondary-light-yellow 로 대체함
const BENEFIT_STYLES: Record<
  BenefitIcon,
  { icon: typeof Wifi; className: string }
> = {
  monitor: {
    icon: MonitorPlay,
    className: 'bg-secondary-light-yellow text-primary-yellow',
  },
  wifi: {
    icon: Wifi,
    className: 'bg-secondary-light-green text-primary-green',
  },
  shield: {
    icon: ShieldCheck,
    className: 'bg-secondary-light-blue text-secondary-blue',
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
            className="flex items-center gap-2 rounded-md bg-neutral-pure-white p-4"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${className}`}
            >
              <Icon size={16} aria-hidden />
            </span>
            <div className="flex flex-col">
              <p className="text-12 font-medium text-text-main">
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
