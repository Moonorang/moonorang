'use client';

import { useState } from 'react';

import { ChevronDown, CircleDollarSign } from 'lucide-react';

import type { AddOn } from '@/entities/addOn/types';

import { cn } from '@/shared/utils/cn';
import { formatWon } from '@/shared/utils/formatCurrency';

interface AddOnSummaryCardProps {
  addOns: AddOn[];
  /** 이용 요금이 어느 달 것인지 (예: 8) */
  billingMonth: number;
}

/**
 * PERSONAL-004: 이용 중인 부가서비스와 그 합계 요금.
 *
 * 제목에는 첫 항목만 적고 나머지는 '외 N개'로 접는다 - 개수가 늘어도 카드 높이가
 * 변하지 않는다. 펼치면 나머지 항목과 각각의 요금을 보여준다.
 */
export default function AddOnSummaryCard({
  addOns,
  billingMonth,
}: AddOnSummaryCardProps) {
  // 1. 상태 및 훅
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. 렌더링
  const totalFee = addOns.reduce(
    (sum, addOn) => sum + addOn.baseMonthlyRate,
    0,
  );
  const [firstAddOn, ...restAddOns] = addOns;

  const title = firstAddOn
    ? `${firstAddOn.title}${restAddOns.length > 0 ? ` 외 ${restAddOns.length}개` : ''}`
    : '이용 중인 부가서비스가 없어요';

  return (
    <section className="flex flex-col rounded-md bg-background-default p-4 shadow-default">
      <h2 className="text-12 font-medium text-text-secondary">
        이용중인 부가서비스
      </h2>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-14 font-medium text-text-primary">{title}</p>

        {/* 접을 게 있을 때만 - 항목이 하나뿐이면 펼쳐도 보여줄 게 없다 */}
        {restAddOns.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '부가서비스 접기' : '부가서비스 모두 보기'}
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-border-light text-text-primary transition-colors hover:bg-border-default"
          >
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              aria-hidden
              className={cn('transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {isExpanded && (
        <ul className="mt-2 flex flex-col gap-1">
          {addOns.map((addOn) => (
            <li
              key={addOn.id}
              className="flex items-center justify-between gap-2 text-12 text-text-secondary"
            >
              <span>{addOn.title}</span>
              <span>{formatWon(addOn.baseMonthlyRate)}원</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-center gap-1 text-12 font-medium text-text-secondary">
        <CircleDollarSign size={14} strokeWidth={1.5} aria-hidden />
        {billingMonth}월 이용 요금
      </p>
      <p className="mt-1 text-14 font-medium text-action-primary">
        {formatWon(totalFee)}원
      </p>
    </section>
  );
}
