'use client';

import { useEffect } from 'react';
import type { ComponentType } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import Button from '@/shared/ui/Button';
import StepProgress from '@/shared/ui/StepProgress';

import { TUTORIAL_STEPS } from '../config/steps';
import { useTutorialGate } from '../model/useTutorialGate';
import { useTutorialStore } from '../model/tutorialStore';
import ChatbotVisual from './visuals/ChatbotVisual';
import HeaderIconsVisual from './visuals/HeaderIconsVisual';
import PlusButtonVisual from './visuals/PlusButtonVisual';
import WelcomeVisual from './visuals/WelcomeVisual';

// 문구는 config/steps.ts, 그림은 여기서 순서대로 짝지어준다
const STEP_VISUALS: ComponentType[] = [
  WelcomeVisual,
  HeaderIconsVisual,
  PlusButtonVisual,
  ChatbotVisual,
];

/**
 * TUTORIAL-001~004: 최초 방문 시 서비스 이용 방법을 안내하는 전체 화면 튜토리얼.
 * 실제 헤더·입력창 위에 겹쳐 그리는 대신, 그 모양을 흉내 낸 그림을 카드 안에 담아
 * 보여준다 - 대화 내역 길이처럼 실제 화면은 방문마다 달라서, 실제 DOM을 그대로
 * 가리키면 매번 위치가 흔들리거나 다른 화면(마이페이지 등)에서는 가리킬 대상 자체가
 * 없을 수 있다. 그림은 항상 같은 자리에 있어서 어느 화면에서 열려도 안정적이다.
 */
export default function TutorialModal() {
  useTutorialGate();

  const isOpen = useTutorialStore((state) => state.isOpen);
  const stepIndex = useTutorialStore((state) => state.stepIndex);
  const goToNext = useTutorialStore((state) => state.goToNext);
  const goToPrev = useTutorialStore((state) => state.goToPrev);
  const finish = useTutorialStore((state) => state.finish);

  // COMMON-005: 떠 있는 동안 배경 스크롤 차단
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const step = TUTORIAL_STEPS[stepIndex];
  const Visual = STEP_VISUALS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      finish();
    } else {
      goToNext();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-(--z-splash)">
          {/* 다른 전체 화면 오버레이(NearbyMembershipCard 지도 모달 등)와 같은 규칙 -
              최대 너비 컬럼 바깥 여백은 검은색으로 채운다(COMMON-006) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full bg-background-page"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-0 flex justify-center">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="서비스 이용 안내"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className="pointer-events-auto flex h-full w-full max-w-(--width-container) flex-col bg-background-subtle"
            >
              {/* 진행 표시줄 + 건너뛰기 */}
              <div className="flex items-center justify-end p-4">
                <StepProgress
                  total={TUTORIAL_STEPS.length}
                  currentIndex={stepIndex}
                  ariaLabel="튜토리얼 진행 단계"
                />

                {/* TUTORIAL-003: 언제든 건너뛸 수 있다 - 완료와 같은 결론이라 finish 그대로 사용 */}
                <Button
                  variant="ghost"
                  radius="full"
                  size="lg"
                  onClick={finish}
                  appendClassName="shrink-0"
                >
                  건너뛰기
                </Button>
              </div>

              {/* 본문 */}
              <div className="flex flex-1 flex-col items-center justify-center gap-8 p-10">
                <Visual />

                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-18 font-bold text-text-primary">
                    {step.title}
                  </h2>
                  <p className="text-14 leading-fixed whitespace-pre-line text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* 이전/다음 */}
              <div className="flex gap-2 px-4 pb-8">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    radius="sm"
                    size="lg"
                    onClick={goToPrev}
                    appendClassName="w-24 shrink-0"
                  >
                    이전
                  </Button>
                )}

                <Button
                  variant="main"
                  radius="sm"
                  size="lg"
                  isFullWidth
                  onClick={handleNext}
                >
                  {step.ctaLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
