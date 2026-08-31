'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

/** 채팅 화면 자체의 경로 - 여기서는 버튼을 숨긴다 */
const CHAT_PATH = '/';
/** 안내 말풍선이 떠 있는 시간(ms) */
const TOOLTIP_VISIBLE_MS = 2800;

/**
 * 채팅이 아닌 다른 화면 우측 하단에 떠 있는, 채팅으로 돌아가는 버튼.
 * 헤더처럼 모든 라우트에 걸치는 전역 UI라 app/_floating-chat-button 에 둔다.
 *
 * 채팅 화면을 벗어나 처음 나타나는 순간에만 "채팅으로 돌아가기" 말풍선을 잠깐
 * 붙였다가 없앤다 - 매번 페이지를 옮길 때마다 뜨면 거슬리므로 세션당 한 번만.
 */
export default function FloatingChatButton() {
  const pathname = usePathname();
  const isChatPath = pathname === CHAT_PATH;

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hasShownTooltipRef = useRef(false);

  // 세션당 한 번만 "보여주기로 결정"한다 - 여기엔 타이머가 없어서, 개발 모드의
  // StrictMode 이중 실행(mount → cleanup → mount)이 일어나도 취소할 게 없다.
  useEffect(() => {
    if (isChatPath || hasShownTooltipRef.current) return;

    hasShownTooltipRef.current = true;
    setIsTooltipVisible(true);
  }, [isChatPath]);

  // 실제로 숨기는 타이머는 별도 effect로 분리한다. isTooltipVisible이 true가 되는
  // 순간에만 반응하므로, 위 effect와 달리 StrictMode 이중 실행과 부딪히지 않는다 -
  // 같은 effect 안에 두면 이중 실행의 cleanup이 타이머를 취소해버려서 문구가
  // 영원히 안 사라지는 문제가 있었다.
  useEffect(() => {
    if (!isTooltipVisible) return;

    const timer = setTimeout(() => setIsTooltipVisible(false), TOOLTIP_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [isTooltipVisible]);

  if (isChatPath) return null;

  return (
    <div className="fixed right-4 bottom-6 z-40 flex items-center gap-2">
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="rounded-md bg-action-secondary-light px-3 py-2 text-12 whitespace-nowrap text-text-primary shadow-default"
          >
            채팅으로 돌아가기
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        href={CHAT_PATH}
        aria-label="채팅으로 돌아가기"
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-action-secondary-light p-1 shadow-default transition-transform hover:scale-105 active:scale-95"
      >
        <Image
          src="/images/chat/ai-avatar.png"
          alt=""
          width={56}
          height={56}
          className="h-full w-full rounded-full object-cover"
        />
      </Link>
    </div>
  );
}
