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
// y축 그리드라인을 (사용량 구간) 스케일 대비 몇 % 지점에 그릴지
const GRID_STEPS = [0, 0.5, 1];
// 요금제 제공량이 실사용량보다 이 배수 넘게 크면, 축을 위쪽에서 압축한다(아래 설명).
const BREAK_RATIO = 1.3;
// 압축 구간이 전체 높이에서 차지하는 비율 - 나머지 아래쪽은 사용량 구간에 온전히 쓴다.
const COMPRESSED_ZONE_RATIO = 0.22;
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

  // 사용량(막대·평균)은 항상 아래쪽 구간에서 자기들끼리 온전한 해상도로 그린다 - 3개월
  // 값 차이가 작아도 실제 오르내림이 그대로 보이도록. 요금제 제공량이 사용량보다 훨씬
  // 크면(=절약 여지가 큰 상황) 그 값을 같은 선형 축에 넣지 않는다 - 그러면 사용량 막대가
  // 전부 바닥에 눌려붙어 서로 구별이 안 되기 때문이다. 대신 위쪽 일부 구간(22%)을
  // "압축 구간"으로 떼어, 한계선은 그 구간 안 어딘가에(스케일과 무관하게) 항상 그린다 -
  // 실제 값은 라벨이 그대로 보여주므로 위치가 정확히 비례하지 않아도 정보 손실은 없다.
  const usageMax = Math.max(...points.map((point) => point.dataUsedMb), averageMb, 1);
  const usageScaleTop = usageMax * BREAK_RATIO;
  const needsScaleBreak = planLimitMb !== null && planLimitMb > usageScaleTop;

  const compressedZoneHeight = needsScaleBreak ? plotHeight * COMPRESSED_ZONE_RATIO : 0;
  const usageZoneHeight = plotHeight - compressedZoneHeight;
  const usageZoneTopY = baselineY - usageZoneHeight;

  const valueToY = (mb: number) => {
    if (!needsScaleBreak || mb <= usageScaleTop) {
      return baselineY - (mb / usageScaleTop) * usageZoneHeight;
    }
    // 압축 구간: [usageScaleTop, planLimitMb] -> [usageZoneTopY, PADDING_TOP]
    const span = (planLimitMb as number) - usageScaleTop;
    const fraction = span > 0 ? (mb - usageScaleTop) / span : 1;
    return usageZoneTopY - fraction * compressedZoneHeight;
  };

  const slotWidth = plotWidth / points.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slotWidth * 0.6);

  const averageY = valueToY(averageMb);
  const limitY = planLimitMb !== null ? valueToY(planLimitMb) : null;

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

          {/* y축 그리드라인 - 사용량 구간(막대가 실제로 그려지는 범위) 기준 */}
          {GRID_STEPS.map((step) => (
            <line
              key={step}
              x1={PADDING_LEFT}
              x2={VIEW_WIDTH - PADDING_RIGHT}
              y1={baselineY - step * usageZoneHeight}
              y2={baselineY - step * usageZoneHeight}
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
        </svg>

        {/* 글자 - SVG 밖에서 실제 CSS px 크기 그대로 렌더링 */}
        <div aria-hidden="true" className="absolute inset-0">
          {/* y축 라벨 */}
          {GRID_STEPS.map((step) => (
            <span
              key={step}
              className="absolute -translate-x-full -translate-y-1/2 text-10 whitespace-nowrap text-text-secondary"
              style={{ left: xPct(PADDING_LEFT - 6), top: yPct(baselineY - step * usageZoneHeight) }}
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

      {/* 범례 - 평균선/한계선은 색만으로 구분하지 않도록 글자로 이름을 붙인다 */}
      <div className="flex items-center gap-4 px-1 text-10 text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-3 border-t-2 border-dotted border-action-primary" />
          평균 사용량
        </span>
        {planLimitMb !== null && (
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-3 border-t-2 border-dotted border-status-warning" />
            요금제 제공량
          </span>
        )}
      </div>
    </div>
  );
}
