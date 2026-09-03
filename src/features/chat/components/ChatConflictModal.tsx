'use client';

import ConfirmModal from '@/shared/ui/ConfirmModal';

interface ChatConflictModalProps {
  /** 로그인 전 게스트로 나눈 메시지 개수 - 안내 문구에 사용 */
  guestMessageCount: number;
  /** "이어서 보기": 게스트 대화를 회원 대화 뒤에 이어붙인다 */
  onKeepBoth: () => void;
  /** "게스트 대화 버리기": 회원 DB 대화만 남긴다 */
  onDiscardGuest: () => void;
}

/**
 * 로그인 직후, 회원 DB에도 이미 대화가 있고 로그인 전 게스트로 나눈 대화도 남아있을 때
 * 뜨는 모달. 서로 다른 두 대화라 자동으로 합치지 않고 사용자에게 물어본다 - 회원의
 * 기존 DB 기록을 삭제하는 선택지는 두지 않는다(되돌릴 수 없는 손실 위험이 커서).
 * 문구·라벨만 이 화면에 고정하고, 실제 모달 뼈대는 공용 ConfirmModal을 그대로 쓴다.
 */
export default function ChatConflictModal({
  guestMessageCount,
  onKeepBoth,
  onDiscardGuest,
}: ChatConflictModalProps) {
  return (
    <ConfirmModal
      isOpen
      title="로그인 전에 나눈 대화가 있어요"
      description={`로그아웃 상태에서 나눈 대화 ${guestMessageCount}개를 기존 대화에 이어서 보여드릴까요?\n 이어서 보지 않으면 이 대화는 사라지고, 기존 대화만 남아요.`}
      cancelLabel="버릴게요"
      confirmLabel="이어서 보기"
      onCancel={onDiscardGuest}
      onConfirm={onKeepBoth}
      // 둘 중 어느 쪽도 "그냥 넘어가는" 안전한 기본값이 아니라 - 배경 클릭·Escape로
      // 조용히 빠져나가지 못하게 막고, 버튼을 직접 눌러야만 닫히게 한다.
      isDismissible={false}
    />
  );
}
