import type { ReactNode } from 'react';

import ExpandToggle from '@/features/catalog/ui/ExpandToggle';

interface CatalogCardProps {
  // 접혀 있을 때도 보이는 카드 본문
  children: ReactNode;
  // 펼침 버튼에 보일 요약. detail 과 함께 있을 때만 버튼이 생긴다.
  expandSummary?: string;
  // 펼쳤을 때 보여줄 내용
  detail?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * 목록 카드 4종(요금제·부가서비스·구독·멤버십)이 공유하는 껍데기.
 * 카드의 배치는 각 Row 가 갖고, 여기서는 테두리와 펼침 영역만 맞춘다.
 */
export default function CatalogCard({
  children,
  expandSummary,
  detail,
  isExpanded = false,
  onToggle,
}: CatalogCardProps) {
  const hasDetail = !!expandSummary && !!detail && !!onToggle;

  return (
    <div className="overflow-hidden rounded-lg bg-background-default shadow-default">
      {children}

      {hasDetail && (
        <ExpandToggle
          summary={expandSummary}
          isExpanded={isExpanded}
          onToggle={onToggle}
        />
      )}

      {hasDetail && isExpanded && (
        <div className="border-t border-border-light px-4 py-3">{detail}</div>
      )}
    </div>
  );
}
