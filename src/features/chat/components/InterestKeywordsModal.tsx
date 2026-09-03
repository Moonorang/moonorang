'use client';

import { useState } from 'react';

import Button from '@/shared/ui/Button';
import FullModal from '@/shared/ui/FullModal';
import { cn } from '@/shared/utils/cn';

import { INTEREST_KEYWORDS } from '@/features/chat/data/interestKeywords';

interface InterestKeywordsModalProps {
  isOpen: boolean;
  /** 지금까지 파악된 관심사(chats.keywords.interests) - 열릴 때 선택 상태의 초기값이 된다 */
  interests: string[];
  onClose: () => void;
  /** 고른 목록을 저장한다. 실패하면 던져서, 이 화면이 사유와 재시도 수단을 보여준다 */
  onSave: (interests: string[]) => Promise<void>;
}

/**
 * CHAT-013/CARD-013·015: 추가 기능 메뉴의 '나의 관심사 알아보기'로 여는 화면.
 *
 * 대화에서 LLM이 뽑아낸 관심사(chats.keywords.interests)를 그대로 칩으로 띄우고,
 * 사용자가 직접 더하거나 뺄 수 있게 한다 - 관심사는 부가서비스·구독 상품 추천의
 * 재료라(rankByInterest.ts), 잘못 파악된 것을 고칠 수단이 있어야 추천이 어긋나도
 * 사용자가 되돌릴 수 있다.
 *
 * 목록에 없는 관심사(대화에서만 나온 "육아" 같은 것)도 칩으로 같이 보여준다 -
 * 안 보여주면 저장하는 순간 조용히 사라진다.
 */
export default function InterestKeywordsModal({
  isOpen,
  interests,
  onClose,
  onSave,
}: InterestKeywordsModalProps) {
  // 1. 상태 및 훅
  const [selected, setSelected] = useState<string[]>(interests);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열릴 때마다 그 시점의 keywords 로 선택 상태를 맞춘다. effect 가 아니라 렌더 중에
  // 바로 반영한다 - "prop이 바뀌면 상태를 조정"하는 경우의 권장 방식이고, 여닫는
  // 사이에 대화로 관심사가 늘어도 다시 열면 그게 그대로 보인다.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelected(interests);
      setError(null);
    }
  }

  // 기본 목록에 없는, 대화에서만 나온 관심사. 기본 칩과 섞어두면 어떤 게 무너가
  // 대화로 알아낸 것인지 구분이 안 돼서 아래쪽에 따로 모아 보여준다.
  const extraInterests = interests.filter(
    (interest) => !INTEREST_KEYWORDS.some((keyword) => keyword === interest),
  );

  // 2. 이벤트 핸들러
  const handleToggle = (keyword: string) => {
    setSelected((prev) =>
      prev.includes(keyword)
        ? prev.filter((item) => item !== keyword)
        : [...prev, keyword],
    );
  };

  const handleSubmit = async () => {
    // COMMON-004: 저장 중 중복 제출 차단
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(selected);
      onClose();
    } catch {
      // COMMON-002: 사유와 재시도 수단(버튼을 다시 누르면 됨)을 남긴다
      setError('관심사를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. 렌더링 도우미 - 기본 목록과 대화에서 알아낸 목록이 칩 모양은 같아서 공유한다
  const renderKeywordChips = (keywords: readonly string[]) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {keywords.map((keyword) => {
        const isSelected = selected.includes(keyword);

        return (
          <Button
            key={keyword}
            variant="filter"
            radius="full"
            size="lg"
            aria-pressed={isSelected}
            disabled={isSaving}
            onClick={() => handleToggle(keyword)}
            appendClassName={cn(
              isSelected &&
                'border-action-primary bg-action-primary-light text-action-primary',
            )}
          >
            {keyword}
          </Button>
        );
      })}
    </div>
  );

  // 4. 렌더링
  return (
    <FullModal isOpen={isOpen} onClose={onClose} ariaLabel="나의 관심사">
      <div className="flex flex-col px-4 pt-2 pb-8">
        <h2 className="flex flex-col gap-5 pt-4 text-center text-16 font-medium text-text-primary">
          <span className="block font-display text-32">
            <span className="text-action-secondary">Moono</span>
            <span className="text-action-primary">rang</span>
          </span>
          <span>무너가 알고 있는 나의 관심사예요! ✨</span>
        </h2>

        <p className="mt-2 text-center text-14 leading-relaxed text-text-primary">
          무너가 나에게 꼭 맞는 데이터와 혜택을 쏙쏙 골라드릴게요.
          <br />
          요즘 가장 관심있는 키워드를 선택해 주세요!
        </p>

        <p className="mt-6 text-12 font-medium text-text-primary">
          가장 관심있는 키워드를 선택해 주세요! (여러개 선택 가능)
        </p>

        {renderKeywordChips(INTEREST_KEYWORDS)}

        {/* 대화에서 알아낸 관심사는 기본 목록과 선으로 갈라서 보여준다 - 어떤 게
            무너가 대화로 알아낸 것인지 한눈에 보이고, 여기서 바로 뺄 수 있다.
            하나도 없으면 줄만 남아 빈 칸처럼 보이므로 통째로 감춘다. */}
        {extraInterests.length > 0 && (
          <>
            <div className="mt-6 h-px w-full bg-border-light" />

            <p className="mt-6 text-12 font-medium text-text-primary">
              무너가 대화에서 알아낸 관심사예요!
            </p>

            {renderKeywordChips(extraInterests)}
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-12 text-status-error">
            {error}
          </p>
        )}

        <Button
          variant="main"
          radius="md"
          size="xl"
          isFullWidth
          disabled={isSaving}
          onClick={handleSubmit}
          appendClassName="mt-8"
        >
          {isSaving ? '저장 중...' : '완료하기'}
        </Button>
      </div>
    </FullModal>
  );
}
