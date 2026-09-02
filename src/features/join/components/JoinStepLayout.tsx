import type { FormEvent, ReactNode } from 'react';

import Button from '@/shared/ui/Button';

interface JoinStepLayoutProps {
  /** 다음 단계로 넘어가는 버튼 문구 */
  submitLabel: string;
  onSubmit: () => void;
  /** 아직 넘어갈 수 없는 단계(필수 동의 미완료 등)에서 버튼을 잠근다 */
  isSubmitDisabled?: boolean;
  /**
   * 넘기면 제출 버튼 왼쪽에 '이전' 버튼이 함께 붙는다.
   * 카드 등록처럼 되돌아갈 일이 잦은 마지막 단계에서만 쓴다 - 다른 단계는
   * 카드 머리의 ‹ 화살표로 돌아간다.
   */
  onPrev?: () => void;
  /** 되돌아갈 곳이 없어진 단계(가입을 마친 뒤 등)에서 이전 버튼을 잠근다 */
  isPrevDisabled?: boolean;
  children: ReactNode;
}

/**
 * 가입 절차 한 단계의 뼈대 - 내용 아래에 다음 단계 버튼이 붙는다.
 * 단계마다 검사할 것이 달라서(폼 검증 등) 실제 이동 판단은 onSubmit 이 맡는다.
 */
export default function JoinStepLayout({
  submitLabel,
  onSubmit,
  isSubmitDisabled = false,
  onPrev,
  isPrevDisabled = false,
  children,
}: JoinStepLayoutProps) {
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col">
      {children}

      {/* 시안의 높이 38px 은 size="lg"(py-2.5 + text-12)가 그대로 만들어 준다 */}
      <div className="mt-4 flex gap-2">
        {onPrev && (
          <Button
            type="button"
            variant="outline"
            radius="sm"
            size="lg"
            isFullWidth
            disabled={isPrevDisabled}
            onClick={onPrev}
          >
            이전
          </Button>
        )}

        <Button
          type="submit"
          variant="main"
          radius="sm"
          size="lg"
          isFullWidth
          disabled={isSubmitDisabled}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
