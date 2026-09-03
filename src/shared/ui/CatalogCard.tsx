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
 *
 * shrink-0을 붙이는 이유: features/chat의 추천 카드들처럼 이 컴포넌트를 높이가
 * 제한된 flex-col 목록(overflow-y-auto) 안에 여러 개 늘어놓는 경우, flex 아이템은
 * 기본으로 shrink 가능(flex-shrink: 1)해서 - 목록이 다 담을 공간보다 내용이
 * 많아지면 스크롤이 생기는 대신 각 카드가 자기 내용보다 낮게 찌그러지는 문제가
 * 있었다(실측: "카드 높이가 안 늘어난다"로 보고됨 - 실제로는 안 늘어나는 게
 * 아니라 내용보다 작게 눌린 것). shrink-0으로 각 카드가 항상 자기 내용만큼의
 * 높이를 갖게 고정하면, 목록 쪽 높이 제한은 카드를 찌그러뜨리는 대신 정상적으로
 * 스크롤을 만든다.
 */
export default function CatalogCard({
  children,
  appendClassName,
}: CatalogCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-30 shrink-0 flex-col overflow-hidden rounded-lg bg-background-default shadow-default',
        appendClassName,
      )}
    >
      {children}
    </div>
  );
}
