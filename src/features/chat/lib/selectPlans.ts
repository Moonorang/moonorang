import {
  parseDataAllowanceToGb,
  parseTetheringSharingGb,
} from '@/entities/plan/lib/format';
import type { Plan } from '@/entities/plan/types';
import type { ChatKeywords } from '@/features/chat/types';

export interface ScoredPlan {
  plan: Plan;
  rank: number;
  /** 0~100, 클수록 적합 (CARD-018 비교 표시에 그대로 쓴다) */
  fitScore: number;
  /** CARD-018: 예산 부합 여부 */
  isWithinBudget: boolean;
}

export interface SelectRecommendedPlansResult {
  recommendations: ScoredPlan[];
  /** CARD-020: 예산 안에 아무것도 없어서 필터를 풀었는지 - 안내 문구 분기에 쓴다 */
  didRelaxBudget: boolean;
  /** CARD-020: 데이터 사용량 요구치를 채우는 요금제가 없어서 필터를 풀었는지 */
  didRelaxDataUsage: boolean;
  /** CARD-020: 테더링 요구량을 채우는 요금제가 없어서 필터를 풀었는지 */
  didRelaxTethering: boolean;
  /**
   * 예산·데이터 사용량 없이 관심사만으로 골랐는지 - true면 recommendPlans.ts가
   * "예산 안에서 데이터 사용 패턴에 맞춰" 대신 관심사 기준 문구를 쓴다.
   */
  isInterestBrowse: boolean;
  /**
   * 실제로 적용된 우선순위 - conditions.priority를 그대로 반영할 때도 있고,
   * "예산만 알고 데이터 사용량은 모름"이라 여기서 자동으로 'budget'을 판단했을
   * 때도 있다(conditions.priority 자체는 undefined로 남아있을 수 있음). recommendPlans.ts가
   * 안내 문구를 어떤 걸로 쓸지 이 값으로 판단한다 - conditions.priority만 보면
   * 자동 판단된 경우를 놓친다.
   */
  effectivePriority: ChatKeywords['priority'];
}

// CARD-015: dataUsageGb 미수집 시 기본값. 성향검사의 '데일리무너' 사용 패턴 정도로 가정한다.
const DEFAULT_DATA_USAGE_GB = 15;

// '무제한'(Infinity)을 점수 계산에 쓰기 위한 대체값.
// 실제 최대 요금제 데이터보다 넉넉히 크게 잡아, 사용량이 아주 큰 경우가 아니면
// 무제한 요금제가 무조건 1위로 뽑히지 않게 한다.
const UNLIMITED_REFERENCE_GB = 300;

function toComparableGb(planGb: number): number {
  return Number.isFinite(planGb) ? planGb : UNLIMITED_REFERENCE_GB;
}

/**
 * 용량(데이터·테더링 등) 적합도(0~100). 필요량을 채우는 요금제 중 초과분이 적을수록
 * 높은 점수를 준다 (라이트 유저에게 무조건 제일 비싼 무제한 요금제를 추천하지 않기 위함).
 * 필요량에 못 미치는 요금제는 부족한 만큼(초과분과 대칭으로) 감점한다 - 그래야 맞는
 * 요금제가 하나도 없을 때도(didRelaxDataUsage 등) "그나마 덜 부족한" 순서가 남는다.
 *
 * 예전엔 부족분을 GB당 고정폭(-5)으로 깎아서, 필요량이 크면(예: 30GB) 6GB만 모자라도
 * 바로 0으로 바닥났다 - 그러면 6GB 요금제와 12GB 요금제가 똑같이 0점으로 묶여 버려서,
 * 예산만 싼 6GB 요금제가 예산 축 하나만으로 12GB 요금제를 제치고 더 위로 뽑히는
 * 문제가 있었다(실측: 예산 4만원 이하·데이터 30GB 이상 조건에서 너겟26(6GB)이
 * 너겟33(12GB)보다 위로 옴). 초과분과 똑같은 "필요량 대비 비율" 공식으로 통일해서,
 * 부족분이 클수록 계속 점수가 갈리게 한다.
 * 데이터·테더링 둘 다 "제공량 대비 요구량" 구조가 같아서 이 함수 하나를 같이 쓴다.
 */
function scoreCapacityFit(availableGb: number, neededGb: number): number {
  const comparableGb = toComparableGb(availableGb);
  const diffGb = comparableGb - neededGb;
  const ratio = neededGb === 0 ? 0 : Math.abs(diffGb) / neededGb;

  return Math.max(0, 100 - ratio * 40);
}

/**
 * 예산 적합도(0~100). 예산 대비 여유가 있을수록(=상대적으로 저렴할수록) 높은 점수.
 * 예산을 안 물어봤으면 전부 중립값을 줘서, 다른 축만으로 순위가 갈리게 한다.
 */
function scoreBudgetFit(monthlyFee: number, budget?: number): number {
  if (!budget) return 50;

  return Math.max(0, Math.min(100, 100 * (1 - monthlyFee / budget)));
}

interface PlanWithGb {
  plan: Plan;
  dataGb: number;
  tetheringGb: number;
}

// 브랜드를 특정하지 않고 "OTT류 혜택이 있으면 다 해당"으로 볼 일반 카테고리 키워드.
// 이 중 하나가 interests에 있으면, plans.benefits.media_contents가 채워진(=OTT/콘텐츠
// 혜택이 있는) 요금제를 전부 후보로 본다. "넷플릭스"처럼 구체적인 이름이면 media_contents
// 문구 안에 그 이름이 실제로 있는지로 좁혀서 매칭한다.
const GENERIC_MEDIA_INTEREST_KEYWORDS = new Set([
  'ott',
  'ott서비스',
  'ott 서비스',
  '오티티',
  '스트리밍',
  '콘텐츠',
  '구독',
]);

function matchesMediaInterest(
  mediaContents: string | undefined,
  interests: string[],
): boolean {
  if (!mediaContents) return false;
  const normalizedMedia = mediaContents.toLowerCase();

  return interests.some((interest) => {
    const normalized = interest.trim().toLowerCase();
    if (!normalized) return false;
    if (GENERIC_MEDIA_INTEREST_KEYWORDS.has(normalized)) return true;
    return normalizedMedia.includes(normalized);
  });
}

// 카드가 한 화면을 다 채우지 않도록 방어적으로 잡은 상한 - 지금 카탈로그 규모(11개)에서
// 한 관심사에 매칭되는 요금제가 이보다 많아지는 일은 실질적으로 없다.
const MAX_INTEREST_BROWSE_RESULTS = 6;

// CARD-016~017: 추천 카드는 최대 3개까지 - resultCount가 이 범위를 벗어나면 안쪽으로
// clamp한다("1개만"처럼 줄이는 요청은 지원하되, 카드 UI가 검증되지 않은 4개 이상으로
// 늘어나는 요청은 지원하지 않는다).
const MIN_RESULT_COUNT = 1;
const DEFAULT_RESULT_COUNT = 3;
const MAX_RESULT_COUNT = 3;

// requested가 없으면(사용자가 개수를 말한 적 없음) defaultCount를 그대로 쓴다 -
// selectPlansByInterest는 자기 기본값(6개)이 따로 있어서, 여기서 일괄로 3개 기본값을
// 강제하면 "관심사만으로 찾을 때는 더 많이 보여준다"는 원래 설계가 조용히 깨진다.
function resolveResultCount(
  requested: number | undefined,
  defaultCount: number,
  maxCount: number,
): number {
  if (requested === undefined) return defaultCount;
  return Math.max(MIN_RESULT_COUNT, Math.min(maxCount, Math.trunc(requested)));
}

/**
 * CARD-013/027: 예산·데이터 사용량을 몰라도, 관심사(예: "넷플릭스", "OTT")만으로
 * 그 혜택이 있는 요금제를 바로 찾아 보여준다 - "관련 상품 있나요?" 같은 정보성
 * 질문에 매번 예산부터 되묻지 않기 위함이다. 예산/데이터가 없으니 순위를 매길 축이
 * 없어서, 월 요금 오름차순(저렴한 것부터)으로만 정렬한다 - 임의로 등수를 매기지 않는다.
 */
function selectPlansByInterest(
  plans: Plan[],
  interests: string[],
  resultCount: number,
): ScoredPlan[] {
  const matched = plans
    .filter((plan) => matchesMediaInterest(plan.benefits?.media_contents, interests))
    .sort((a, b) => a.monthlyFee - b.monthlyFee)
    .slice(0, resultCount);

  return matched.map((plan, index) => ({
    plan,
    rank: index + 1,
    // 예산/데이터가 없어 적합도를 계산할 축이 없다 - 순위 매기기(CARD-018)용으로만
    // 등수에 반비례하는 값을 준다.
    fitScore: Math.max(0, 100 - index * 10),
    isWithinBudget: true,
  }));
}

/**
 * CARD-001: 요금제 선별은 LLM이 아니라 이 순수 함수의 연산으로 한다.
 * LLM(recommend_plans)은 이 함수가 정한 planId·rank에 대한 reason 문장만 생성해야 한다.
 *
 * 예산·데이터 사용량이 둘 다 없는데 관심사만 있으면 selectPlansByInterest로 갈라진다
 * (isInterestBrowse: true) - 아래 1~4단계는 그 경우가 아닐 때(또는 관심사 매칭이
 * 하나도 없을 때의 대체 경로)만 탄다.
 *
 * 예산·데이터 사용량·테더링은 "말했으면 반드시 지켜야 하는 조건"이라 순서대로 하드
 * 필터로 거른다(소프트 가중치로만 두면, 가중치가 작은 축은 다른 축 점수에 묻혀 사실상
 * 무시될 수 있다 - 예: 예산 적합도가 워낙 높은 저가 요금제가, "데이터 30GB 이상"을
 * 명시한 사용자에게도 데이터 부족한 채로 1위로 뽑히는 문제). 채워지지 않으면 그
 * 단계만 완화하고(CARD-020) 이전 단계 결과는 유지한다.
 *
 * 1. 예산 필터 → 없으면 완화(전체 대상), didRelaxBudget = true
 * 2. (1의 결과에서) 데이터 사용량 필터 → 없으면 완화(1의 결과 유지), didRelaxDataUsage = true.
 *    conditions.dataUsageGb가 아예 없으면(사용자가 숫자를 말한 적 없음) 이 단계는
 *    건너뛴다 - DEFAULT_DATA_USAGE_GB는 아래 4단계 점수를 매길 기준값일 뿐이라,
 *    사용자가 요구한 적 없는 값으로 요금제를 걸러내면 안 된다.
 * 3. (2의 결과에서) 테더링 필터 → 없으면 완화(2의 결과 유지), didRelaxTethering = true
 * 4. 남은 후보를 정렬한다. conditions.priority(또는 그로부터 자동 판단된
 *    effectivePriority)에 따라 네 갈래로 나뉜다:
 *    - 'data'("이전보다 데이터 더 많이", "무제한으로" 처럼 dataUsageGb를 숫자로 못
 *      박기보다 예산 안에서 데이터가 가장 많은 쪽을 원하는 경우): 데이터 제공량
 *      내림차순(동률이면 저렴한 순)으로 직접 정렬한다.
 *    - 'priciest'("월 5만원대로 추천해줘"처럼 데이터 언급 없이 예산만 준 경우, 또는
 *      "제일 비싼 걸로"): 월 요금 내림차순(동률이면 데이터 많은 순)으로 직접
 *      정렬한다 - 예산을 최대한 활용하는 쪽을 우선한다.
 *    - 'cheapest'("제일 싼 걸로", "가장 저렴한 걸로"): priciest와 정반대로 월 요금
 *      오름차순(동률이면 데이터 많은 순)으로 정렬한다.
 *    - 그 외(기본값, 예산·데이터 사용량을 둘 다 구체적으로 준 균형 잡힌 요청):
 *      데이터 적합도(60%) + 예산 적합도(25%) + 테더링 적합도(15%)로 채점해 내림차순
 *      정렬 - 필터를 통과한 후보끼리 "더 딱 맞는" 순서를 가리는 타이브레이커다.
 *    dataUsageGb를 억지로 큰 숫자로 추정해 우선순위를 흉내 내려던 이전 시도는, 그
 *    숫자 하나에 따라 "중간 요금제가 다 밀려나거나 특정 등급만 셋 다 뽑히거나"
 *    결과가 들쭉날쭉해지는 문제가 있었다(실측) - 그래서 정렬 기준 자체를 갈래로 나눴다.
 * 5. 상위 몇 개까지 보여줄지(기본 3개)는 conditions.resultCount로 정한다 - "1개만
 *    추천해줘"처럼 명시했으면 그 개수(1~3으로 clamp)만큼만, rank 1부터 매겨 돌려준다.
 *
 * 같은 plans·conditions 입력이면 항상 같은 결과가 나온다(NFR-005) - 순수 계산이라
 * temperature/seed 같은 LLM 샘플링 설정에 기댈 필요가 없다.
 */
export function selectRecommendedPlans(
  plans: Plan[],
  conditions: ChatKeywords,
): SelectRecommendedPlansResult {
  // 예산·데이터 사용량을 둘 다 모르면 순위를 매길 축이 없다 - 이때 관심사가 있으면
  // (예: "넷플릭스 관련 상품 있나요?") 그 혜택이 있는 요금제만 바로 찾아 보여준다.
  // 매칭되는 게 하나도 없으면 아래 일반 로직(기본값 기준 전체 카탈로그)으로 넘어간다 -
  // "관심사에 맞는 게 없다"고 빈 카드를 보여주는 것보다, 차선책이라도 보여주는 게 낫다.
  if (!conditions.budget && !conditions.dataUsageGb && conditions.interests?.length) {
    const interestResultCount = resolveResultCount(
      conditions.resultCount,
      MAX_INTEREST_BROWSE_RESULTS,
      MAX_INTEREST_BROWSE_RESULTS,
    );
    const byInterest = selectPlansByInterest(
      plans,
      conditions.interests,
      interestResultCount,
    );
    if (byInterest.length > 0) {
      return {
        recommendations: byInterest,
        didRelaxBudget: false,
        didRelaxDataUsage: false,
        didRelaxTethering: false,
        isInterestBrowse: true,
        effectivePriority: undefined,
      };
    }
  }

  const usageGb = conditions.dataUsageGb ?? DEFAULT_DATA_USAGE_GB;

  const withGb: PlanWithGb[] = plans.map((plan) => ({
    plan,
    dataGb: parseDataAllowanceToGb(plan.dataAllowance),
    tetheringGb: parseTetheringSharingGb(plan.benefits?.tethering_sharing),
  }));

  // 1단계: 예산
  const withinBudget = conditions.budget
    ? withGb.filter((item) => item.plan.monthlyFee <= conditions.budget!)
    : withGb;
  const didRelaxBudget = Boolean(conditions.budget) && withinBudget.length === 0;
  const afterBudget = didRelaxBudget ? withGb : withinBudget;

  // 2단계: 데이터 사용량 (1단계를 통과한 후보 안에서만 거른다). "최소 30GB 이상"처럼
  // 사용자가 직접 숫자를 말한 경우에만 하드 필터로 지킨다 - DEFAULT_DATA_USAGE_GB로
  // 대체된 usageGb는 순위 채점(아래 scored)에만 쓰고, 여기서 걸러내는 데는 안 쓴다.
  const withinDataUsage = conditions.dataUsageGb
    ? afterBudget.filter((item) => item.dataGb >= conditions.dataUsageGb!)
    : afterBudget;
  const didRelaxDataUsage =
    Boolean(conditions.dataUsageGb) && withinDataUsage.length === 0;
  const afterDataUsage = didRelaxDataUsage ? afterBudget : withinDataUsage;

  // 3단계: 테더링 (2단계를 통과한 후보 안에서만 거른다)
  const withinTethering = conditions.tetheringGb
    ? afterDataUsage.filter((item) => item.tetheringGb >= conditions.tetheringGb!)
    : afterDataUsage;
  const didRelaxTethering =
    Boolean(conditions.tetheringGb) && withinTethering.length === 0;
  const candidates = didRelaxTethering ? afterDataUsage : withinTethering;

  const isWithinBudget = (fee: number) =>
    !conditions.budget || fee <= conditions.budget;

  // 등수에 반비례하는 표시용 점수 - 가중치 채점이 아니라 직접 정렬(데이터순/가격순)
  // 일 때 쓴다(selectPlansByInterest와 같은 방식).
  const scoreByRank = (index: number) => Math.max(0, 100 - index * 10);

  // "예산만 알고 데이터 사용량은 전혀 모름"은 LLM이 매번 priority: "priciest"를
  // 명시적으로 채워주길 바라는 대신, 이미 확정된 두 필드(budget 있음·dataUsageGb
  // 없음)만으로 여기서 직접 판단한다 - "숫자·생활 패턴 언급이 없으면 이 규칙을
  // 적용하라"는 지시를 모델이 놓치는 경우가 실측으로 확인됐다(예산만 준 "월
  // 5만원대로 추천해줘"에 priority가 계속 안 채워짐). 반대로 dataUsageGb가 이미
  // 있으면(=사용자가 사용 패턴을 언급했거나 이전 턴에 파악됨) 균형 계산이 이미
  // 뜻이 있으므로 이 자동 판단을 적용하지 않는다.
  const effectivePriority: ChatKeywords['priority'] =
    conditions.priority ??
    (conditions.budget && !conditions.dataUsageGb ? 'priciest' : undefined);

  let scored: { plan: Plan; fitScore: number; isWithinBudget: boolean }[];

  if (effectivePriority === 'data') {
    // "예산 안에서 데이터가 가장 많은 쪽"을 직접 정렬한다 - toComparableGb의 300은
    // 적합도 점수 계산용 대체값이라 여기선 안 쓰고, dataGb 원본(무제한=Infinity)을
    // 그대로 비교해서 무제한이 항상 가장 위로 오게 한다. 동률(예: 무제한끼리)이면
    // 저렴한 쪽을 우선한다.
    scored = candidates
      .slice()
      .sort((a, b) => {
        // dataGb가 둘 다 무제한(Infinity)이면 뺄셈이 NaN이 되므로, 먼저 동등
        // 비교로 진짜 동률(무제한끼리 포함)인지 가려서 가격 타이브레이커로 넘긴다.
        if (a.dataGb !== b.dataGb) return b.dataGb - a.dataGb;
        return a.plan.monthlyFee - b.plan.monthlyFee;
      })
      .map(({ plan }, index) => ({
        plan,
        fitScore: scoreByRank(index),
        isWithinBudget: isWithinBudget(plan.monthlyFee),
      }));
  } else if (effectivePriority === 'priciest') {
    // "월 5만원대로 추천해줘"처럼 데이터 언급 없이 예산만 준 경우, 또는 "제일
    // 비싼 걸로"처럼 명시한 경우 - 예산을 최대한 활용하는(=그 안에서 가장 비싼)
    // 쪽을 우선한다. 동률이면 데이터 많은 쪽을 우선한다(가격이 같다면 더 주는
    // 쪽이 더 나은 선택이라).
    scored = candidates
      .slice()
      .sort((a, b) => {
        if (a.plan.monthlyFee !== b.plan.monthlyFee) {
          return b.plan.monthlyFee - a.plan.monthlyFee;
        }
        // 위 데이터 정렬과 같은 이유로, 둘 다 무제한이면 뺄셈이 NaN이라 동등
        // 비교를 먼저 한다.
        return b.dataGb - a.dataGb;
      })
      .map(({ plan }, index) => ({
        plan,
        fitScore: scoreByRank(index),
        isWithinBudget: isWithinBudget(plan.monthlyFee),
      }));
  } else if (effectivePriority === 'cheapest') {
    // "제일 싼 걸로", "가장 저렴한 걸로" - priciest와 정반대로 월 요금 오름차순.
    // 동률이면 마찬가지로 데이터 많은 쪽을 우선한다.
    scored = candidates
      .slice()
      .sort((a, b) => {
        if (a.plan.monthlyFee !== b.plan.monthlyFee) {
          return a.plan.monthlyFee - b.plan.monthlyFee;
        }
        return b.dataGb - a.dataGb;
      })
      .map(({ plan }, index) => ({
        plan,
        fitScore: scoreByRank(index),
        isWithinBudget: isWithinBudget(plan.monthlyFee),
      }));
  } else {
    scored = candidates
      .map(({ plan, dataGb, tetheringGb }) => {
        // 정렬은 반올림 전(rawFitScore) 값으로 한다 - 화면에 보여줄 fitScore를
        // 미리 반올림해서 정렬 기준으로 쓰면, 실제로는 순위가 갈리는 두 요금제가
        // 반올림값만 같아서(예: 64.55 vs 64.975 -> 둘 다 65) 동점으로 묶여버리고,
        // 그러면 정렬이 원래 배열 순서(= plans.id 순서, 곧 더 싼 요금제)로 되돌아가
        // "실제로는 더 적합한데 저렴하지 않다는 이유로 밀리는" 문제가 생겼다
        // (실측: 예산 4만원 이하·데이터 30GB 이상 조건에서 너겟33이 너겟26에
        // 밀려 top3에서 빠짐).
        const rawFitScore =
          scoreCapacityFit(dataGb, usageGb) * 0.6 +
          scoreBudgetFit(plan.monthlyFee, conditions.budget) * 0.25 +
          scoreCapacityFit(tetheringGb, conditions.tetheringGb ?? 0) * 0.15;

        return {
          plan,
          fitScore: Math.round(rawFitScore),
          rawFitScore,
          isWithinBudget: isWithinBudget(plan.monthlyFee),
        };
      })
      .sort((a, b) => b.rawFitScore - a.rawFitScore);
  }

  const resultCount = resolveResultCount(
    conditions.resultCount,
    DEFAULT_RESULT_COUNT,
    MAX_RESULT_COUNT,
  );
  const recommendations = scored.slice(0, resultCount).map((item, index) => ({
    plan: item.plan,
    fitScore: item.fitScore,
    isWithinBudget: item.isWithinBudget,
    rank: index + 1,
  }));

  return {
    recommendations,
    didRelaxBudget,
    didRelaxDataUsage,
    didRelaxTethering,
    isInterestBrowse: false,
    effectivePriority,
  };
}
