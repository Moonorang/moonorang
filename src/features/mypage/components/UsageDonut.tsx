/** 링 두께(px). 시안의 바깥 원과 안쪽 원 반지름 차이(32.5 - 28.5)와 같다 */
const RING_WIDTH = 4;

/** 링 바깥 지름(px) */
const SIZE = 65;

const RADIUS = (SIZE - RING_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface UsageDonutProps {
  /** 사용한 비율(0~100). 무제한 요금제처럼 비율을 낼 수 없으면 null */
  usedPercent: number | null;
}

/**
 * PERSONAL-004: 데이터를 얼마나 썼는지 한눈에 보여주는 링.
 *
 * 원 두 개를 겹치는 대신 stroke 하나로 그린다 - 카드 배경색이 바뀌어도 안쪽을
 * 덮는 원의 색을 따로 맞출 필요가 없어서다.
 */
export default function UsageDonut({ usedPercent }: UsageDonutProps) {
  const isMeasurable = usedPercent !== null;
  // 0~100 을 벗어난 값이 들어와도 링이 깨지지 않게 잘라둔다
  const ratio = isMeasurable
    ? Math.min(Math.max(usedPercent, 0), 100) / 100
    : 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={
        isMeasurable
          ? `데이터 ${usedPercent.toFixed(1)}퍼센트 사용중`
          : '데이터 무제한 요금제'
      }
    >
      <svg width={SIZE} height={SIZE} aria-hidden>
        {/* -90도 돌려 12시 방향에서 시작하게 한다 */}
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={RING_WIDTH}
            className="stroke-border-default"
          />
          {isMeasurable && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={RING_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
              className="stroke-action-secondary"
            />
          )}
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-16 text-text-primary">
          {isMeasurable ? `${usedPercent.toFixed(1)}%` : '무제한'}
        </p>
        <p className="text-10 font-medium text-text-secondary">
          {isMeasurable ? '사용중' : '데이터'}
        </p>
      </div>
    </div>
  );
}
