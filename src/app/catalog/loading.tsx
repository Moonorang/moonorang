import { cn } from '@/shared/utils/cn';

// 탭 이름 길이(요금제·부가서비스·구독 상품·멤버십)에 맞춘 자리표시자 폭
const TAB_WIDTHS = ['w-9', 'w-15', 'w-14', 'w-9'];

/**
 * COMMON-001: 목록을 받아오는 동안 보여줄 스켈레톤 UI.
 * 진입 시 기본 탭이 요금제라 요금제 카드 모양으로 자리를 잡아둔다.
 * PlanRow / ExpandToggle 배치가 바뀌면 여기도 같이 고쳐야 로딩이 끝날 때 화면이 튀지 않는다.
 */
export default function CatalogLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-(--width-container) flex-col bg-background-subtle pt-(--height-header)">
      {/* CatalogTabs 자리 */}
      <div className="flex gap-5 border-b border-border-light bg-background-default px-4">
        {TAB_WIDTHS.map((width, index) => (
          <div
            key={index}
            className={cn('my-2 h-5 rounded-sm bg-border-light', width)}
          />
        ))}
      </div>

      <ul className="flex animate-pulse flex-col gap-2 px-4 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={index}
            className="flex h-30 flex-col overflow-hidden rounded-lg bg-background-default shadow-default"
          >
            {/* 요금제명 · 데이터/테더링 · 월 요금 */}
            <div className="flex flex-1 items-center gap-3 px-4 pt-5 pb-2">
              <div className="ml-1 h-4 w-12 shrink-0 rounded-sm bg-border-light" />

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="h-3 w-20 rounded-sm bg-border-light" />
                <div className="h-2.5 w-28 rounded-sm bg-border-light" />
              </div>

              <div className="h-4 w-20 shrink-0 rounded-sm bg-border-light" />
            </div>

            {/* 혜택 요약 (ExpandToggle 자리) */}
            <hr className="mx-4 border-border-default" />
            <div className="flex items-center gap-1.5 px-4 pt-2 pb-5">
              <div className="h-3 w-35 rounded-sm bg-border-light" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
