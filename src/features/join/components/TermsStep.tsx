'use client';

import { useLayoutEffect, useRef, useState } from 'react';

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

/**
 * 이 요소를 감싸고 있는 스크롤 영역(채팅 목록)을 최하단으로 내린다.
 * 대화 화면 구조를 여기서 알 수는 없으므로 위로 올라가며 실제로 스크롤되는
 * 조상을 찾는다.
 */
function scrollAncestorToBottom(element: HTMLElement | null): void {
  let parent = element?.parentElement ?? null;

  while (parent) {
    const isScrollable =
      parent.scrollHeight > parent.clientHeight &&
      /auto|scroll/.test(window.getComputedStyle(parent).overflowY);

    if (isScrollable) {
      parent.scrollTop = parent.scrollHeight;
      return;
    }

    parent = parent.parentElement;
  }
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
  const listRef = useRef<HTMLUListElement>(null);

  const isAllAgreed = agreedIds.length === JOIN_TERMS.length;

  // 2. 부수 효과
  // 약관을 펼치면 카드가 상세 영역 높이만큼 길어지는데, 스크롤 위치는 그대로라
  // 바닥 기준으로는 그만큼 위로 밀려난 것처럼 보인다. 펼칠 때마다 최하단에 붙인다.
  // 그리기 전에 옮겨야(useLayoutEffect) 튀는 순간이 눈에 안 보인다.
  useLayoutEffect(() => {
    if (expandedId === null) return;

    scrollAncestorToBottom(listRef.current);
  }, [expandedId]);

  // 3. 이벤트 핸들러
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

  // 4. 렌더링
  return (
    <JoinStepLayout
      submitLabel={submitLabel}
      onSubmit={onNext}
      isSubmitDisabled={!hasAgreedRequiredTerms(agreedIds)}
    >
      <div className="pt-4">
        {/* 전체 동의 - 두 줄 문구를 감싸는 테두리 상자 */}
        <div className="flex items-center gap-2 rounded-md border border-text-secondary px-3 py-2.5">
          <CheckBox
            id="join-term-all"
            isChecked={isAllAgreed}
            onChange={handleAllToggle}
          />

          <label
            htmlFor="join-term-all"
            className="min-w-0 cursor-pointer break-keep"
          >
            <span className="block text-12 text-text-primary">
              모든 약관을 확인 후 동의합니다.
            </span>
            <span className="block text-10 text-text-secondary">
              (선택항목 포함)
            </span>
          </label>
        </div>

        <ul ref={listRef} className="mt-4 flex flex-col gap-3">
          {JOIN_TERMS.map((term) => {
            const isExpanded = expandedId === term.id;

            return (
              <li key={term.id} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CheckBox
                    id={`join-term-${term.id}`}
                    isChecked={agreedIds.includes(term.id)}
                    onChange={(isChecked) =>
                      handleTermToggle(term.id, isChecked)
                    }
                  />

                  <label
                    htmlFor={`join-term-${term.id}`}
                    className="min-w-0 flex-1 cursor-pointer text-12 break-keep text-text-primary"
                  >
                    {term.title}
                  </label>

                  <span className="shrink-0 text-10 text-text-secondary">
                    {term.isRequired ? '필수' : '선택'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExpandToggle(term.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`join-term-detail-${term.id}`}
                    aria-label={`${term.title} 약관 ${isExpanded ? '접기' : '펼치기'}`}
                    className="shrink-0 cursor-pointer text-text-primary transition-colors hover:text-action-primary"
                  >
                    <ChevronRight
                      size={18}
                      strokeWidth={1.5}
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
                    <p className="text-10 leading-relaxed break-keep whitespace-pre-line text-text-secondary">
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
