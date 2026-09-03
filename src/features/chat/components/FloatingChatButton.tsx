'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import { isFloatingChatButtonHidden } from '@/features/chat/data/floatingButtonHiddenRoutes';

/** 채팅 화면 자체의 경로 - 이동 목적지이자, 여길 벗어나야 버튼이 뜬다 */
const CHAT_PATH = '/';
/** 안내 말풍선이 떠 있는 시간(ms) */
const TOOLTIP_VISIBLE_MS = 2800;

/**
 * 채팅이 아닌 다른 화면 우측 하단에 떠 있는, 채팅으로 돌아가는 버튼.
 * "채팅으로 돌아가기"라는 채팅 도메인 개념이라 features/chat 소속이지만, 모든
 * 라우트에 걸쳐 떠 있어야 해서 실제로 마운트되는 자리는 app/layout.tsx다
 * (app이 features를 가져다 쓰는 건 정상적인 방향이라 문제 없음).
 *
 * 채팅 화면을 벗어나 처음 나타나는 순간에만 "채팅으로 돌아가기" 말풍선을 잠깐
 * 붙였다가 없앤다 - 매번 페이지를 옮길 때마다 뜨면 거슬리므로 세션당 한 번만.
 */
export default function FloatingChatButton() {
  const pathname = usePathname();
  const isHidden = isFloatingChatButtonHidden(pathname);

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hasShownTooltipRef = useRef(false);

  // 세션당 한 번만 "보여주기로 결정"한다 - 여기엔 타이머가 없어서, 개발 모드의
  // StrictMode 이중 실행(mount → cleanup → mount)이 일어나도 취소할 게 없다.
  useEffect(() => {
    if (isHidden || hasShownTooltipRef.current) return;

    hasShownTooltipRef.current = true;
    setIsTooltipVisible(true);
  }, [isHidden]);

  useEffect(() => {
    if (!isTooltipVisible) return;

    const timer = setTimeout(
      () => setIsTooltipVisible(false),
      TOOLTIP_VISIBLE_MS,
    );
    return () => clearTimeout(timer);
  }, [isTooltipVisible]);

  if (isHidden) return null;

  return (
    // 헤더/입력창과 같은 이유 - fixed는 뷰포트 기준이라, 그냥 right-4로 두면 넓은
    // 화면에서 최대 너비 컬럼 밖(뷰포트 오른쪽 끝)으로 나가버린다. 감싸는 div를
    // 컬럼 폭으로 맞춘 뒤(pointer-events-none) 그 안에서 우측 정렬한다.
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 mx-auto flex w-full max-w-(--width-container) justify-end px-4">
      <div className="pointer-events-auto flex items-center gap-2">
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
    </div>
  );
}
