'use client';

import { useState } from 'react';

import { ChevronRight } from 'lucide-react';

import CheckBox from '@/shared/ui/CheckBox';

import JoinStepLayout from '@/features/join/components/JoinStepLayout';
import { JOIN_TERMS } from '@/features/join/data/terms';
import { hasAgreedRequiredTerms } from '@/features/join/lib/terms';

import { cn } from '@/shared/utils/cn';

interface TermsStepProps {
  submitLabel: string;
  /** 동의한 약관 id 들. 이전 단계로 다녀와도 유지되도록 카드가 들고 있다 */
  agreedIds: string[];
  onAgreedIdsChange: (agreedIds: string[]) => void;
  onNext: () => void;
}

/** CARD-034: 2단계 - 약관 동의. 필수 약관을 모두 받아야 다음으로 넘어간다 */
export default function TermsStep({
  submitLabel,
  agreedIds,
  onAgreedIdsChange,
  onNext,
}: TermsStepProps) {
  // 1. 상태 및 훅
  // 펼쳐 둔 약관 - 좁은 카드라 한 번에 하나만 연다
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAllAgreed = agreedIds.length === JOIN_TERMS.length;

  // 2. 이벤트 핸들러
  const handleAllToggle = (isChecked: boolean) => {
    onAgreedIdsChange(isChecked ? JOIN_TERMS.map((term) => term.id) : []);
  };

  const handleTermToggle = (id: string, isChecked: boolean) => {
    onAgreedIdsChange(
      isChecked
        ? [...agreedIds, id]
        : agreedIds.filter((agreedId) => agreedId !== id),
    );
  };

  const handleExpandToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 3. 렌더링
  return (
    <JoinStepLayout
      submitLabel={submitLabel}
      onSubmit={onNext}
      isSubmitDisabled={!hasAgreedRequiredTerms(agreedIds)}
    >
      <div className="pt-4">
        {/* 전체 동의 - 두 줄 문구를 감싸는 테두리 상자 */}
        <div className="flex items-center gap-3 rounded-md border border-text-secondary px-4 py-2.5">
          <CheckBox
            id="join-term-all"
            isChecked={isAllAgreed}
            onChange={handleAllToggle}
          />

          <label htmlFor="join-term-all" className="cursor-pointer">
            <span className="block text-12 text-text-primary">
              모든 약관을 확인 후 동의합니다.
            </span>
            <span className="block text-12 text-text-secondary">
              (선택항목 포함)
            </span>
          </label>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {JOIN_TERMS.map((term) => {
            const isExpanded = expandedId === term.id;

            return (
              <li key={term.id} className="flex flex-col">
                <div className="flex items-center gap-3 px-4">
                  <CheckBox
                    id={`join-term-${term.id}`}
                    isChecked={agreedIds.includes(term.id)}
                    onChange={(isChecked) =>
                      handleTermToggle(term.id, isChecked)
                    }
                  />

                  <label
                    htmlFor={`join-term-${term.id}`}
                    className="flex-1 cursor-pointer text-12 text-text-primary"
                  >
                    {term.title} ({term.isRequired ? '필수' : '선택'})
                  </label>

                  <button
                    type="button"
                    onClick={() => handleExpandToggle(term.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`join-term-detail-${term.id}`}
                    aria-label={`${term.title} 약관 ${isExpanded ? '접기' : '펼치기'}`}
                    className="shrink-0 cursor-pointer text-text-primary transition-colors hover:text-action-primary"
                  >
                    <ChevronRight
                      size={20}
                      strokeWidth={1.4}
                      aria-hidden
                      className={cn(
                        'transition-transform',
                        isExpanded && 'rotate-90',
                      )}
                    />
                  </button>
                </div>

                {/* 전문은 길어서 접어 두고, 펼쳐도 카드가 끝없이 늘어나지 않게 높이를 잡는다 */}
                {isExpanded && (
                  <div
                    id={`join-term-detail-${term.id}`}
                    className="mt-2 max-h-40 overflow-y-auto rounded-sm bg-background-subtle p-3"
                  >
                    <p className="text-10 leading-relaxed whitespace-pre-line text-text-secondary">
                      {term.content}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </JoinStepLayout>
  );
}
