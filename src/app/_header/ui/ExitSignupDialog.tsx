'use client';

import ConfirmModal from '@/shared/ui/ConfirmModal';

interface ExitSignupDialogProps {
  /** 그만두기 처리 중 - 중복 제출을 막는다(COMMON-004) */
  isExiting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 추가 정보 입력을 마치기 전에 나가려 할 때 뜨는 확인 창.
 * 여기서 나가면 인증 세션까지 정리되므로, 그 결과를 먼저 알리고 확인을 받는다(AUTH-004).
 * 문구·라벨만 이 화면에 고정하고, 실제 모달 뼈대는 공용 ConfirmModal을 그대로 쓴다.
 */
export default function ExitSignupDialog({
  isExiting,
  onCancel,
  onConfirm,
}: ExitSignupDialogProps) {
  return (
    <ConfirmModal
      isOpen
      title="가입을 그만두시겠어요?"
      description={
        '지금 나가면 로그아웃되고, 입력하신 내용은 저장되지 않아요.\n 다시 이용하시려면 카카오 로그인부터 진행해 주세요.'
      }
      cancelLabel="이어서 할게요"
      confirmLabel="그만둘래요"
      isConfirming={isExiting}
      confirmingLabel="나가는 중..."
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
