import { AlertTriangle, Clock, WifiOff } from 'lucide-react';

import Button from '@/components/common/Button';

import { cn } from '@/utils/cn';
import type { ChatErrorReason } from '@/types/chat';

interface ChatErrorNoticeProps {
  reason: ChatErrorReason;
  onRetry?: () => void;
  className?: string;
}

// 실패 사유를 구분해서 표시
// 사유 + 조치 방법을 같이 안내
// 재시도 버튼
const REASON_CONTENT: Record<
  ChatErrorReason,
  { icon: typeof WifiOff; title: string; description: string }
> = {
  runtime_unavailable: {
    icon: WifiOff,
    title: '무너가 지금 응답할 수 없어요',
    description: '서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.',
  },
  timeout: {
    icon: Clock,
    title: '응답이 너무 오래 걸리고 있어요',
    description: '요청이 시간 안에 끝나지 않았어요. 다시 시도해주세요.',
  },
  invalid_format: {
    icon: AlertTriangle,
    title: '답변을 정리하는 데 문제가 생겼어요',
    description: '응답 형식이 예상과 달랐어요. 다시 시도해주세요.',
  },
};

export default function ChatErrorNotice({
  reason,
  onRetry,
  className,
}: ChatErrorNoticeProps) {
  const { icon: Icon, title, description } = REASON_CONTENT[reason];

  return (
    <div
      role="alert"
      className={cn(
        'flex w-full items-start gap-3 rounded-md border border-secondary-light-red bg-secondary-light-red/40 p-3',
        className,
      )}
    >
      <Icon
        size={18}
        className="mt-0.5 shrink-0 text-primary-red"
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="text-14 font-bold text-text-main">{title}</p>
          <p className="text-12 text-text-secondary">{description}</p>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            radius="full"
            onClick={onRetry}
            className="self-start"
          >
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}
