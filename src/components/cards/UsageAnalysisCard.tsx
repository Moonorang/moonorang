import {
  Smartphone,
  ChevronDown,
  CircleDollarSign,
  Pencil,
  Wifi,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';

import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { formatWon } from '@/utils/formatCurrency';

interface UsageAnalysisCardProps {
  currentPlanName: string;
  currentPlanPrice: number;
  addonsName: string;
  addonsPrice: number;
  dataRemaining: string;
  voiceRemaining: string;
  smsRemaining: string;
  usagePercentage: number;
  dataAlertLimit: string;
  onEditAlert?: () => void;
  className?: string;
}

export default function UsageAnalysisCard({
  currentPlanName,
  currentPlanPrice,
  addonsName,
  addonsPrice,
  dataRemaining,
  voiceRemaining,
  smsRemaining,
  usagePercentage,
  dataAlertLimit,
  onEditAlert,
  className,
}: UsageAnalysisCardProps) {
  // SVG 도넛 차트를 위한 둘레 계산 (반지름 r=24)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (usagePercentage / 100) * circumference;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-1.5 px-1">
        <Smartphone size={16} className="text-text-main" aria-hidden />
        <h3 className="text-14 font-bold text-text-main">사용량 분석</h3>
      </div>

      {/* 현재 요금제 */}
      <div className="flex flex-col gap-1 rounded-lg bg-neutral-pure-white p-4">
        <div className="flex items-center justify-between text-10 text-text-secondary">
          <span>현재 요금제</span>
          <span className="flex items-center gap-1">
            <CircleDollarSign size={12} aria-hidden /> 8월 이용 요금
          </span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-14 font-bold text-text-main">
            {currentPlanName}
          </span>
          <span className="text-14 font-bold text-primary-red">
            {formatWon(currentPlanPrice)}원
          </span>
        </div>
      </div>

      {/* 이용중인 부가서비스 */}
      <div className="flex flex-col gap-1 rounded-lg bg-neutral-pure-white p-4">
        <div className="flex items-center justify-between text-10 text-text-secondary">
          <span>이용중인 부가서비스</span>
          <span className="flex items-center gap-1">
            <CircleDollarSign size={12} aria-hidden /> 8월 이용 요금
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1">
            <span className="text-14 font-bold text-text-main">
              {addonsName}
            </span>
            <ChevronDown
              size={14}
              className="text-text-secondary"
              aria-hidden
            />
          </div>
          <span className="text-14 font-bold text-primary-red">
            {formatWon(addonsPrice)}원
          </span>
        </div>
      </div>

      {/* 남은 사용량 */}
      <div className="flex flex-col gap-4 rounded-lg bg-neutral-pure-white p-4">
        <h4 className="text-center text-12 font-bold text-text-main">
          남은 사용량
        </h4>

        <div className="flex items-center justify-between gap-4">
          {/* 도넛 차트 */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 60 60"
            >
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="fill-none stroke-border-gray"
                strokeWidth="6"
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="fill-none stroke-primary-yellow"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-14 font-bold text-text-main">
                {usagePercentage}%
              </span>
              <span className="text-10 text-text-secondary">사용중</span>
            </div>
          </div>

          {/* 잔여량 뱃지 */}
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between rounded-sm bg-secondary-light-blue px-2 py-1 text-10 font-bold text-secondary-blue">
              <span className="flex items-center gap-1">
                <Wifi size={12} /> 데이터
              </span>
              <span>{dataRemaining}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-secondary-light-green px-2 py-1 text-10 font-bold text-primary-green">
              <span className="flex items-center gap-1">
                <PhoneCall size={12} /> 음성
              </span>
              <span>{voiceRemaining}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-secondary-light-yellow px-2 py-1 text-10 font-bold text-primary-yellow">
              <span className="flex items-center gap-1">
                <MessageCircle size={12} /> SMS
              </span>
              <span>{smsRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 알림 설정 */}
      <div className="flex items-center justify-between rounded-lg bg-neutral-pure-white p-4">
        <div className="flex flex-col gap-1">
          <span className="text-10 text-text-secondary">
            현재 데이터 제한 알림 설정
          </span>
          <span className="text-14 font-bold text-text-main">
            {dataAlertLimit} 남았을 때
          </span>
        </div>
        <Button
          variant="outline"
          radius="full"
          onClick={onEditAlert}
          className="flex items-center gap-1 px-3 py-1.5 text-10 text-text-secondary"
        >
          <Pencil size={12} /> 수정하기
        </Button>
      </div>
    </div>
  );
}
