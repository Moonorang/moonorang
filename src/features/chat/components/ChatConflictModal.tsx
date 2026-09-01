'use client';

import { useEffect } from 'react';

import Button from '@/shared/ui/Button';

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
 */
export default function ChatConflictModal({
  guestMessageCount,
  onKeepBoth,
  onDiscardGuest,
}: ChatConflictModalProps) {
  // COMMON-005: 모달이 떠 있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="chat-conflict-title"
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-text-primary/50 px-4"
    >
      <div className="flex w-full max-w-(--width-container) flex-col gap-4 rounded-md bg-background-default p-4">
        <div className="flex flex-col gap-1">
          <h2 id="chat-conflict-title" className="text-14 font-bold text-text-primary">
            로그인 전에 나눈 대화가 있어요
          </h2>
          <p className="text-12 text-text-secondary">
            로그아웃 상태에서 나눈 대화 {guestMessageCount}개를 기존 대화에 이어서
            보여드릴까요? 이어서 보지 않으면 이 대화는 사라지고, 기존 대화만 남아요.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onDiscardGuest}
          >
            버릴게요
          </Button>
          <Button
            variant="main"
            radius="sm"
            size="lg"
            isFullWidth
            onClick={onKeepBoth}
          >
            이어서 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
