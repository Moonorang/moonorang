import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface CatalogCardProps {
  children: ReactNode;
  /** 기본 그림자를 다른 테두리 스타일로 바꾸는 등, 호출부별 모양 차이를 위한 탈출구 */
  appendClassName?: string;
}

/**
 * 목록 카드 4종(요금제·부가서비스·구독·멤버십)이 공유하는 껍데기.
 * 카드 안의 배치는 각 Row 가 갖고, 여기서는 테두리와 최소 높이만 맞춘다.
 * 예전엔 펼침(expand/detail) 기능도 여기서 가졌지만, 상세를 별도 모달로 여는
 * 방식(useCatalogDetail + *DetailModal)으로 바뀌면서 필요 없어졌다.
 *
 * 폭을 스스로 정하지 않아서(w-full 등 없음), 좁은 부모 안에 두면 그대로 좁아진다 -
 * features/catalog의 목록 페이지(전체 폭)와 features/chat의 카드(w-[80%]) 둘 다
 * 이 컴포넌트를 그대로 재사용한다.
 */
export default function CatalogCard({
  children,
  appendClassName,
}: CatalogCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-30 flex-col overflow-hidden rounded-lg bg-background-default shadow-default',
        appendClassName,
      )}
    >
      {children}
    </div>
  );
}
