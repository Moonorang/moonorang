'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { Volume2 } from 'lucide-react';

import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';

interface ReadAloudButtonProps {
  text: string;
  className?: string;
}

const subscribeToNothing = () => () => {};
const getIsSupportedOnClient = () => 'speechSynthesis' in window;
const getIsSupportedOnServer = () => false;

export default function ReadAloudButton({
  text,
  className,
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
      onClick={handleReadAloudClick}
      aria-label={isSpeaking ? '읽기 중지' : '메시지 읽기'}
      className={cn(
        'flex items-center justify-center gap-1 bg-neutral-pure-white px-2 py-1.5 text-10 text-text-main',
        className,
      )}
    >
      <Volume2 size={12} aria-hidden className="text-secondary-blue" />
      <span>{isSpeaking ? '정지' : '읽기'}</span>
    </Button>
  );
}
