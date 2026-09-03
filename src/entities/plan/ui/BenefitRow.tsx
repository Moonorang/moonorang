import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/utils/cn';
import type { BenefitTone } from '@/entities/plan/types';

interface BenefitRowProps {
  icon: LucideIcon;
  tone: BenefitTone;
  title: string;
  subTitle?: string;
}

const TONE_STYLES: Record<BenefitTone, string> = {
  secondary: 'bg-action-secondary-light text-action-secondary',
  accent1: 'bg-accent-1-light text-accent-1',
  accent2: 'bg-accent-2-light text-accent-2',
  primary: 'bg-action-primary-light text-action-primary',
};

/** 요금제 상세 카드의 혜택 한 줄 - 아이콘 타일 + 제목(+ 부제) */
export default function BenefitRow({
  icon: Icon,
  tone,
  title,
  subTitle,
}: BenefitRowProps) {
  return (
    <li className="flex h-11 items-center gap-2 rounded-md bg-background-default px-4 shadow-default">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
          TONE_STYLES[tone],
        )}
      >
        <Icon size={20} aria-hidden />
      </span>

      <div className="flex min-w-0 flex-col">
        <p className="truncate text-12 font-medium text-text-primary">
          {title}
        </p>
        {subTitle && (
          <p className="truncate text-10 font-medium text-text-secondary">
            {subTitle}
          </p>
        )}
      </div>
    </li>
  );
}
