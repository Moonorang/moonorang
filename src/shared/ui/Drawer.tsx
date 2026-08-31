'use client';

import { useEffect, type ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 스크린리더가 읽을 패널 이름. 닫기 버튼 라벨('{ariaLabel} 닫기')에도 쓰인다 */
  ariaLabel: string;
  children: ReactNode;
  /** 우측 상단 닫기 버튼 노출 여부 */
  hasCloseButton?: boolean;
  /** 패널에 덧붙일 클래스 (폭 조정 등). 배치 전용 - 색상 등 디자인은 여기 넣지 않는다 */
  appendClassName?: string;
}

/**
 * 화면 우측에서 밀려 나오는 오버레이 패널.
 * 딤 배경, Escape 닫기, 배경 스크롤 차단(COMMON-005)까지 여기서 처리하고
 * 내용은 children 으로 받는다.
 */
export default function Drawer({
  isOpen,
  onClose,
  ariaLabel,
  children,
  hasCloseButton = true,
  appendClassName,
}: DrawerProps) {
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
          {/* 딤 배경은 컨테이너 폭에 묶이지 않고 화면 전체를 덮음 */}
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
          <div className="pointer-events-none relative mx-auto h-full w-full max-w-(--width-container)">
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className={cn(
                'pointer-events-auto absolute top-0 right-0 flex h-full w-[70%] flex-col bg-background-default',
                appendClassName,
              )}
            >
              {hasCloseButton && (
                <div className="flex h-(--height-header) items-center justify-end px-4 py-3">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={`${ariaLabel} 닫기`}
                    className="flex h-6 w-6 items-center justify-center text-text-primary transition-colors hover:cursor-pointer hover:text-action-primary"
                  >
                    <X size={24} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              )}

              {children}
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
