'use client';

import { useEffect, type ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 스크린리더가 읽을 패널 이름. 닫기 버튼 라벨('{ariaLabel} 닫기')에도 쓰인다 */
  ariaLabel: string;
  children: ReactNode;
  /** 헤더의 뒤로가기(닫기) 노출 여부 */
  hasCloseButton?: boolean;
  /** 패널에 덧붙일 클래스 (배경색 등). 배치 전용 - 색상 등 디자인은 여기 넣지 않는다 */
  appendClassName?: string;
}

/**
 * 화면을 통째로 덮는 오버레이 화면.
 * 딤 배경, Escape 닫기, 배경 스크롤 차단(COMMON-005)까지 여기서 처리하고
 * 내용은 children 으로 받는다 - 여기서는 바닥과 헤더만 깔고, 그 위에 올릴
 * 카드는 쓰는 쪽이 정한다.
 *
 * 닫기를 X 가 아니라 헤더의 뒤로가기로 그리는 이유는, 화면을 다 덮으면
 * 사용자에게 "떠 있는 창"이 아니라 "넘어간 화면"으로 읽히기 때문이다.
 * 좌측에서 밀려 들어오는 것도 같은 이유다 - 화면 전환과 같은 방향으로 움직인다.
 */
export default function Modal({
  isOpen,
  onClose,
  ariaLabel,
  children,
  hasCloseButton = true,
  appendClassName,
}: ModalProps) {
  // 부수 효과: 배경 스크롤 차단 및 Escape로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-(--z-modal)">
          {/* 딤 배경. 모바일에서는 패널에 다 가려지고, 넓은 화면에서
              컨테이너(768px) 바깥을 덮는 역할을 한다 */}
          <motion.button
            type="button"
            aria-label={`${ariaLabel} 닫기`}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          {/* 패널만 컨테이너 폭 안에 정렬. 래퍼는 클릭을 통과시켜 배경 닫기를 막지 않음 */}
          <div className="pointer-events-none absolute inset-0 flex justify-center">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className={cn(
                'pointer-events-auto flex h-full w-full max-w-(--width-container) flex-col bg-background-subtle',
                appendClassName,
              )}
            >
              {hasCloseButton && (
                // 앱 헤더와 같은 높이·같은 뒤로가기 버튼으로 그려서 화면을 넘어온 것처럼 보이게 한다
                <header className="flex h-(--height-header) shrink-0 items-center bg-background-default px-4 py-3">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={`${ariaLabel} 닫기`}
                    className="flex h-6 w-6 items-center justify-center text-text-secondary transition-colors hover:cursor-pointer hover:text-text-primary"
                  >
                    <ChevronLeft
                      size={24}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                </header>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
