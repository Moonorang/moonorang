import type { ReactNode } from 'react';

interface JoinAlreadyNoticeProps {
  /** 무엇을 이미 쓰고 있는지 - 상품 종류마다 다르다 */
  message: ReactNode;
}

/**
 * COMMON-004: 이미 이용 중인 상품이라 절차를 열지 않고 대신 보여주는 안내.
 *
 * JoinSignupNotice 와 같은 자리에 같은 모양으로 서지만 버튼이 없다 - 로그인은
 * 사용자가 지금 할 수 있는 일이라 버튼을 주지만, 이미 이용 중인 것은 여기서
 * 할 일이 없다. 대화로 돌아가 다른 것을 물어보면 된다.
 */
export default function JoinAlreadyNotice({ message }: JoinAlreadyNoticeProps) {
  return (
    <p className="mt-4 text-center text-12 leading-fixed text-text-primary">
      {message}
    </p>
  );
}
