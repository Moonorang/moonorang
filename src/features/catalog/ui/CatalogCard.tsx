import type { ReactNode } from 'react';

interface CatalogCardProps {
  children: ReactNode;
}

/**
 * 목록 카드 4종(요금제·부가서비스·구독·멤버십)이 공유하는 껍데기.
 * 카드 안의 배치는 각 Row 가 갖고, 여기서는 테두리와 최소 높이만 맞춘다.
 */
export default function CatalogCard({ children }: CatalogCardProps) {
  return (
    <div className="flex min-h-30 flex-col overflow-hidden rounded-lg bg-background-default shadow-default">
      {children}
    </div>
  );
}
