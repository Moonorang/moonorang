import { Fragment } from 'react';

import { formatMbLabel } from '@/features/usage/lib/formatUsage';

import { cn } from '@/shared/utils/cn';

interface UsageTrendPoint {
  /** 'YYYY-MM' */
  billingMonth: string;
  dataUsedMb: number;
}

interface UsageTrendChartProps {
  /** 오래된 달 -> 최근 달 순, 보통 3개 */
  points: UsageTrendPoint[];
  averageMb: number;
  /** 무제한 요금제면 null - 한계선을 안 그린다 */
  planLimitMb: number | null;
  appendClassName?: string;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 260;
const PADDING_LEFT = 34;
const PADDING_RIGHT = 12;
const PADDING_TOP = 22;
const PADDING_BOTTOM = 24;
const MAX_BAR_WIDTH = 32;
// y축 그리드라인을 스케일 대비 몇 % 지점에 그릴지 - 맨 아래(0)는 항상 0,
// 맨 위(1)는 usageScaleTop, 중간(0.5)은 그 정중앙이다.
const GRID_STEPS = [0, 0.5, 1];
// 평균선과 한계선의 y좌표가 이보다 가까우면(=사용량이 제공량에 거의 다 찬 상황) 따로
// 안 그리고 하나로 합쳐서 그린다 - 두 선 다 같은 점선 패턴이라 겹치면 나중에 그려지는
// 한계선이 평균선을 완전히 가리기 때문. 이 값보다 멀면 원래 위치에 각자 그린다.
const LINE_MERGE_THRESHOLD = 6;
const BAR_GRADIENT_ID = 'usage-trend-bar-gradient';

function formatMonthLabel(billingMonth: string): string {
  const month = Number(billingMonth.split('-')[1]);
  return Number.isFinite(month) ? `${month}월` : billingMonth;
}


/** viewBox 좌표를 컨테이너 기준 %로 - 텍스트는 SVG 밖에 HTML로 겹쳐 그려서 글자 크기가
 * viewBox 축소 비율의 영향을 안 받게 한다 (카드 폭이 좁으면 SVG 안 text의 font-size도
 * 같이 줄어들어 10px 지정이 실제로는 더 작게 렌더링되는 문제가 있었다). */
const xPct = (x: number) => `${(x / VIEW_WIDTH) * 100}%`;
const yPct = (y: number) => `${(y / VIEW_HEIGHT) * 100}%`;

/**
 * CARD-024/028 - 최근 3개월 데이터 사용량 막대 + y축 + 평균선 + 요금제 한계선.
 * 라이브러리 없이 순수 SVG(도형)+HTML(글자) 조합으로 그린다 (모바일 채팅 카드 안에
 * 들어가는 작은 크기).
 */
export default function UsageTrendChart({
  points,
  averageMb,
  planLimitMb,
  appendClassName,
}: UsageTrendChartProps) {
  if (points.length === 0) return null;

  const plotWidth = VIEW_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const baselineY = PADDING_TOP + plotHeight;

  // y축 상한 - 3개월 사용량 중 최댓값과 요금제 제공량을 비교해서 더 큰 쪽으로 정한다.
  // 사용량이 제공량보다 크면(이미 넘어섰거나 근접) 사용량 기준, 사용량이 제공량보다
  // 작으면(여유 있음) 제공량 기준. 이러면 막대·평균선·한계선이 전부 하나의 선형 축
  // 안에서 실제 비율 그대로 그려져서, 별도의 "압축 구간" 같은 예외 처리가 필요 없다.
  const usagePointsMax = Math.max(...points.map((point) => point.dataUsedMb));
  const usageScaleTop = Math.max(usagePointsMax, planLimitMb ?? 0, 1);

  const valueToY = (mb: number) => baselineY - (mb / usageScaleTop) * plotHeight;

  const slotWidth = plotWidth / points.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slotWidth * 0.6);

  const averageY = valueToY(averageMb);
  const limitY = planLimitMb !== null ? valueToY(planLimitMb) : null;

  // 평균선과 한계선의 y좌표가 너무 가까우면(=사용량이 제공량에 거의 다 찬 상황) 따로
  // 안 그리고, 두 색을 섞은 굵은 선 하나로 합쳐서 그린다 - "둘이 사실상 같다"는 걸
  // 위치가 아니라 색 자체로 보여주는 게 억지로 갈라놓는 것보다 더 정확한 표현이다.
  const isMerged = limitY !== null && Math.abs(limitY - averageY) < LINE_MERGE_THRESHOLD;
  const mergedY = isMerged && limitY !== null ? (averageY + limitY) / 2 : null;

  // 막대 위치/크기는 SVG 도형과 HTML 라벨 양쪽에서 똑같이 써야 해서 한 번만 계산해둔다.
  const bars = points.map((point, index) => {
    const barHeight = baselineY - valueToY(point.dataUsedMb);
    const barX = PADDING_LEFT + slotWidth * index + (slotWidth - barWidth) / 2;
    const barY = baselineY - barHeight;

    return { point, barX, barY, barHeight, centerX: barX + barWidth / 2 };
  });

  const summary = [
    `최근 ${points.length}개월 데이터 사용량: ` +
      points
        .map(
          (point) =>
            `${formatMonthLabel(point.billingMonth)} ${formatMbLabel(point.dataUsedMb)}`,
        )
        .join(', '),
    `평균 ${formatMbLabel(averageMb)}`,
    planLimitMb !== null ? `요금제 제공량 ${formatMbLabel(planLimitMb)}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div className={cn('flex flex-col gap-2', appendClassName)}>
      <div
        role="img"
        aria-label={summary}
        className="relative w-full"
        style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
      >
        {/* 도형(막대/선)만 - 글자는 아래에 HTML로 따로 겹쳐 그린다 */}
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            {/* 기존 gradient 버튼 variant와 같은 토큰 - 코럴에서 옐로우로 */}
            <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--color-gradient-from)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--color-gradient-to)' }} />
            </linearGradient>
          </defs>

          {/* y축 그리드라인 - 0(맨 아래) / usageScaleTop(맨 위) / 그 중간 */}
          {GRID_STEPS.map((step) => (
            <line
              key={step}
              x1={PADDING_LEFT}
              x2={VIEW_WIDTH - PADDING_RIGHT}
              y1={baselineY - step * plotHeight}
              y2={baselineY - step * plotHeight}
              className="stroke-border-default"
              strokeWidth={1}
            />
          ))}

          {/* 막대 - 그라데이션(코럴 -> 옐로우), 위아래 다 둥근 알약 모양 */}
          {bars.map(({ point, barX, barY, barHeight }) => (
            <rect
              key={point.billingMonth}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={`url(#${BAR_GRADIENT_ID})`}
            />
          ))}

          {mergedY !== null ? (
            // 평균 사용량과 요금제 제공량이 사실상 같은 위치라, 두 색을 섞은 굵은
            // 선 하나로 합쳐서 그린다(강조 목적으로 일반 선보다 굵게).
            <line
              x1={PADDING_LEFT}
              x2={VIEW_WIDTH - PADDING_RIGHT}
              y1={mergedY}
              y2={mergedY}
              style={{
                stroke:
                  'color-mix(in srgb, var(--color-action-primary) 50%, var(--color-status-warning) 50%)',
              }}
              strokeWidth={4}
              strokeDasharray="1 4"
              strokeLinecap="round"
            />
          ) : (
            <>
              {/* 평균선 - action-primary로 눈에 띄게 */}
              <line
                x1={PADDING_LEFT}
                x2={VIEW_WIDTH - PADDING_RIGHT}
                y1={averageY}
                y2={averageY}
                className="stroke-action-primary"
                strokeWidth={2}
                strokeDasharray="1 4"
                strokeLinecap="round"
              />

              {/* 요금제 한계선 - 무제한이면 생략 */}
              {limitY !== null && (
                <line
                  x1={PADDING_LEFT}
                  x2={VIEW_WIDTH - PADDING_RIGHT}
                  y1={limitY}
                  y2={limitY}
                  className="stroke-status-warning"
                  strokeWidth={2}
                  strokeDasharray="1 4"
                  strokeLinecap="round"
                />
              )}
            </>
          )}
        </svg>

        {/* 글자 - SVG 밖에서 실제 CSS px 크기 그대로 렌더링 */}
        <div aria-hidden="true" className="absolute inset-0">
          {/* y축 라벨 */}
          {GRID_STEPS.map((step) => (
            <span
              key={step}
              className="absolute -translate-x-full -translate-y-1/2 text-10 whitespace-nowrap text-text-secondary"
              style={{ left: xPct(PADDING_LEFT - 6), top: yPct(baselineY - step * plotHeight) }}
            >
              {formatMbLabel(usageScaleTop * step)}
            </span>
          ))}

          {/* 막대 위 값 + 월 라벨 */}
          {bars.map(({ point, barY, centerX }) => (
            <Fragment key={point.billingMonth}>
              <span
                className="absolute -translate-x-1/2 -translate-y-full text-10 font-bold whitespace-nowrap text-text-primary"
                style={{ left: xPct(centerX), top: yPct(barY - 6) }}
              >
                {formatMbLabel(point.dataUsedMb)}
              </span>
              <span
                className="absolute -translate-x-1/2 text-10 whitespace-nowrap text-text-secondary"
                style={{ left: xPct(centerX), top: yPct(baselineY + 8) }}
              >
                {formatMonthLabel(point.billingMonth)}
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* 범례 - 선이 겹쳐서 하나로 합쳐 그려진 경우에도, 평균/제공량 자체는 서로 다른
          값이므로 항상 각자 따로 표시한다(색만으로 구분하지 않도록 글자도 붙임). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-10 text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-3 border-t-2 border-dotted border-action-primary" />
          평균 사용량 {formatMbLabel(averageMb)}
        </span>
        {planLimitMb !== null && (
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-3 border-t-2 border-dotted border-status-warning" />
            요금제 제공량 {formatMbLabel(planLimitMb)}
          </span>
        )}
      </div>
    </div>
  );
}
