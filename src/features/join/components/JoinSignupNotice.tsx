import type { ReactNode } from 'react';

import Button from '@/shared/ui/Button';

interface JoinSignupNoticeProps {
  /** 왜 지금 로그인해야 하는지 - 상품 종류마다 다르다 */
  message: ReactNode;
  /**
   * 카카오 회원가입 버튼. features/auth 의 것이라 이 카드가 직접 가져오지 못해
   * 바깥(app)에서 넣어준다.
   */
  children: ReactNode;
  /**
   * 로그인을 미루고 원래 화면으로 돌아간다.
   * 안 넘기면 '이전' 버튼을 안 그린다 - 절차가 시작되기도 전에 막아선 자리라
   * 돌아갈 곳이 없는 경우가 있다(부가서비스·구독의 첫 단계).
   */
  onPrev?: () => void;
}

/**
 * CARD-044: 회원만 할 수 있는 자리에서 대신 뜨는 회원가입 안내.
 *
 * 다른 화면으로 보내지 않고 카드 안에서 처리한다 - 여기까지 온 사람에게 필요한
 * 것은 로그인 화면이 아니라 '왜 지금 가입해야 하는지'와 그 자리에서 누를 버튼이다.
 *
 * 요금제는 절차를 다 밟은 뒤 결제 단계에서, 부가서비스·구독은 절차가 시작되는
 * 첫 단계에서 이 안내를 쓴다. 어디서 막아서느냐가 다를 뿐 보여줄 것은 같다.
 */
export default function JoinSignupNotice({
  message,
  children,
  onPrev,
}: JoinSignupNoticeProps) {
  return (
    <div className="flex flex-col">
      <p className="mt-4 text-center text-12 leading-fixed text-text-primary">
        {message}
      </p>

      <div className="mt-4">{children}</div>

      {onPrev && (
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
      )}
    </div>
  );
}
