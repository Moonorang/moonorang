import { AlertTriangle, Clock, Loader2, ServerCrash, WifiOff } from 'lucide-react';

import Button from '@/shared/ui/Button';

import { cn } from '@/shared/utils/cn';
import type { ChatErrorReason } from '@/features/chat/types';

interface ChatErrorNoticeProps {
  reason: ChatErrorReason;
  onRetry?: () => void;
  /**
   * CARD-006 재시도 중임을 알리는 상태. true면 실패 카드를 곧바로 없애고 빈 말풍선
   * (타이핑 표시)만 남기는 대신, 실패 사유는 그대로 보여준 채로 아이콘·버튼만
   * "다시 시도하는 중"으로 바꿔서 방금 누른 재시도가 실제로 진행 중임을 알려준다.
   */
  isRetrying?: boolean;
  appendClassName?: string;
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
    description: '서비스 연결이 원활하지 않아요. 네트워크 상태를 확인 후 다시 시도해주세요.',
  },
  ai_server_error: {
    icon: ServerCrash,
    title: 'AI 서버에 일시적인 문제가 있어요',
    description:
      '회원님 네트워크는 정상이에요. 무너의 응답 서버가 잠시 불안정한 상태이니, 잠시 후 다시 시도해주세요.',
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
  isRetrying = false,
  appendClassName,
}: ChatErrorNoticeProps) {
  const { icon: Icon, title, description } = REASON_CONTENT[reason];

  return (
    <div
      role="alert"
      aria-busy={isRetrying}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border border-action-primary-light bg-action-primary-light/40 p-3',
        appendClassName,
      )}
    >
      {isRetrying ? (
        <Loader2
          size={18}
          className="mt-0.5 shrink-0 animate-spin text-action-primary"
          aria-hidden
        />
      ) : (
        <Icon size={18} className="mt-0.5 shrink-0 text-action-primary" aria-hidden />
      )}

      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="text-14 font-bold text-text-primary">{title}</p>
          <p className="text-12 text-text-secondary">{description}</p>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            radius="full"
            onClick={onRetry}
            disabled={isRetrying}
            appendClassName="self-start"
          >
            {isRetrying ? '다시 시도하는 중…' : '다시 시도'}
          </Button>
        )}
      </div>
    </div>
  );
}
