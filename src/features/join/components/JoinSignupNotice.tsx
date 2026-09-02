import type { ReactNode } from 'react';

import Button from '@/shared/ui/Button';

interface JoinSignupNoticeProps {
  /**
   * 카카오 회원가입 버튼. features/auth 의 것이라 이 카드가 직접 가져오지 못해
   * 바깥(app)에서 넣어준다.
   */
  children: ReactNode;
  /** 가입을 미루고 결제 정보로 돌아간다 */
  onPrev: () => void;
}

/**
 * CARD-044: 비회원이 결제하기를 눌렀을 때 결제 대신 뜨는 회원가입 안내.
 *
 * 다른 화면으로 보내지 않고 카드 안에서 처리한다 - 여기까지 온 사람에게 필요한
 * 것은 로그인 화면이 아니라 '왜 지금 가입해야 하는지'와 그 자리에서 누를 버튼이다.
 */
export default function JoinSignupNotice({
  children,
  onPrev,
}: JoinSignupNoticeProps) {
  return (
    <div className="flex flex-col">
      <p className="mt-4 text-center text-12 leading-fixed text-text-primary">
        요금제 가입은 회원만 할 수 있어요.
        <br />
        카카오로 가입하고 이어서 진행해 주세요.
      </p>

      <div className="mt-4">{children}</div>

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onPrev}
        >
          이전
        </Button>
      </div>
    </div>
  );
}
