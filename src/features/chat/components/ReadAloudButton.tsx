'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { Volume2 } from 'lucide-react';

import Button from '@/shared/ui/Button';
import { cn } from '@/shared/utils/cn';

interface ReadAloudButtonProps {
  text: string;
  appendClassName?: string;
}

const subscribeToNothing = () => () => {};
const getIsSupportedOnClient = () => 'speechSynthesis' in window;
const getIsSupportedOnServer = () => false;

export default function ReadAloudButton({
  text,
  appendClassName,
}: ReadAloudButtonProps) {
  const isSupported = useSyncExternalStore(
    subscribeToNothing,
    getIsSupportedOnClient,
    getIsSupportedOnServer,
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReadAloudClick = () => {
    const { speechSynthesis } = window;
    speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      radius="full"
      size="sm"
      gap="sm"
      onClick={handleReadAloudClick}
      aria-label={isSpeaking ? '읽기 중지' : '메시지 읽기'}
      // ghost 기본값 대신 흰 배경의 작은 알약 모양 - 여기서만 쓰는 조합이라 변형 대신 탈출구로 처리
      appendClassName={cn('bg-background-default', appendClassName)}
    >
      <Volume2 size={12} aria-hidden className="text-accent-2" />
      <span>{isSpeaking ? '정지' : '읽기'}</span>
    </Button>
  );
}
