import {
  Smartphone,
  ChevronDown,
  CircleDollarSign,
  Pencil,
  Wifi,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';
import { formatWon } from '@/shared/utils/formatCurrency';

interface UsageAnalysisCardProps {
  currentPlanName: string;
  currentPlanPrice: number;
  // 이용 중인 부가서비스 정보가 없는 문맥(예: 채팅 절약 상담)에서는 이 구획 자체를 생략한다 -
  // 실제 가입 내역 없이 값을 지어내지 않기 위함(NFR-003~004와 같은 취지).
  addonsName?: string;
  addonsPrice?: number;
  dataRemaining: string;
  voiceRemaining: string;
  smsRemaining: string;
  usagePercentage: number;
  // 알림 설정 정보가 없는 문맥에서는 이 구획도 생략한다.
  dataAlertLimit?: string;
  onEditAlert?: () => void;
  appendClassName?: string;
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
  appendClassName,
}: UsageAnalysisCardProps) {
  // SVG 도넛 차트를 위한 둘레 계산 (반지름 r=24)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (usagePercentage / 100) * circumference;

  return (
    <div
      className={cn(
        'flex w-[min(80%,440px)] flex-col gap-3 rounded-md bg-background-default p-4 shadow-default',
        appendClassName,
      )}
    >
      <div className="flex items-center gap-1.5 px-1">
        <Smartphone size={16} className="text-text-primary" aria-hidden />
        <h3 className="text-14 font-bold text-text-primary">사용량 분석</h3>
      </div>

      {/* 현재 요금제 */}
      <div className="flex flex-col gap-1 rounded-lg bg-background-subtle p-4">
        <div className="flex items-center justify-between text-10 text-text-secondary">
          <span>현재 요금제</span>
          <span className="flex items-center gap-1">
            <CircleDollarSign size={12} aria-hidden /> 8월 이용 요금
          </span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-14 font-bold text-text-primary">
            {currentPlanName}
          </span>
          <span className="text-14 font-bold text-action-primary">
            {formatWon(currentPlanPrice)}원
          </span>
        </div>
      </div>

      {/* 이용중인 부가서비스 - 데이터가 있을 때만 표시 */}
      {addonsName !== undefined && addonsPrice !== undefined && (
        <div className="flex flex-col gap-1 rounded-lg bg-background-subtle p-4">
          <div className="flex items-center justify-between text-10 text-text-secondary">
            <span>이용중인 부가서비스</span>
            <span className="flex items-center gap-1">
              <CircleDollarSign size={12} aria-hidden /> 8월 이용 요금
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1">
              <span className="text-14 font-bold text-text-primary">
                {addonsName}
              </span>
              <ChevronDown
                size={14}
                className="text-text-secondary"
                aria-hidden
              />
            </div>
            <span className="text-14 font-bold text-action-primary">
              {formatWon(addonsPrice)}원
            </span>
          </div>
        </div>
      )}

      {/* 남은 사용량 */}
      <div className="flex flex-col gap-4 rounded-lg bg-background-subtle p-4">
        <h4 className="text-center text-12 font-bold text-text-primary">
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
                className="fill-none stroke-border-default"
                strokeWidth="6"
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="fill-none stroke-action-secondary"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-14 font-bold text-text-primary">
                {usagePercentage}%
              </span>
              <span className="text-10 text-text-secondary">사용중</span>
            </div>
          </div>

          {/* 잔여량 뱃지 */}
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between rounded-sm bg-accent-2-light px-2 py-1 text-10 font-bold text-accent-2">
              <span className="flex items-center gap-1">
                <Wifi size={12} /> 데이터
              </span>
              <span>{dataRemaining}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-accent-1-light px-2 py-1 text-10 font-bold text-accent-1">
              <span className="flex items-center gap-1">
                <PhoneCall size={12} /> 음성
              </span>
              <span>{voiceRemaining}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-action-secondary-light px-2 py-1 text-10 font-bold text-action-secondary">
              <span className="flex items-center gap-1">
                <MessageCircle size={12} /> SMS
              </span>
              <span>{smsRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 알림 설정 - 설정값이 있을 때만 표시 */}
      {dataAlertLimit !== undefined && (
        <div className="flex items-center justify-between rounded-lg bg-background-subtle p-4">
          <div className="flex flex-col gap-1">
            <span className="text-10 text-text-secondary">
              현재 데이터 제한 알림 설정
            </span>
            <span className="text-14 font-bold text-text-primary">
              {dataAlertLimit} 남았을 때
            </span>
          </div>
          <Button
            variant="outline"
            radius="full"
            gap="sm"
            onClick={onEditAlert}
          >
            <Pencil size={12} /> 수정하기
          </Button>
        </div>
      )}
    </div>
  );
}
