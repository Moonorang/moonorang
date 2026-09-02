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
  /** CARD-020: 테더링 요구량을 채우는 요금제가 없어서 필터를 풀었는지 */
  didRelaxTethering: boolean;
  /**
   * 예산·데이터 사용량 없이 관심사만으로 골랐는지 - true면 recommendPlans.ts가
   * "예산 안에서 데이터 사용 패턴에 맞춰" 대신 관심사 기준 문구를 쓴다.
   */
  isInterestBrowse: boolean;
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
 * 필요량에 못 미치는 요금제는 부족한 만큼 크게 감점하되, 0으로 떨어뜨리지는 않는다 -
 * 그래야 맞는 요금제가 하나도 없을 때도 상대적으로 나은 대안 순서가 남는다.
 * 데이터·테더링 둘 다 "제공량 대비 요구량" 구조가 같아서 이 함수 하나를 같이 쓴다.
 */
function scoreCapacityFit(availableGb: number, neededGb: number): number {
  const comparableGb = toComparableGb(availableGb);
  const diffGb = comparableGb - neededGb;

  if (diffGb >= 0) {
    const excessRatio = neededGb === 0 ? 0 : diffGb / neededGb;
    return Math.max(0, 100 - excessRatio * 40);
  }

  const shortfallGb = -diffGb;
  return Math.max(0, 30 - shortfallGb * 5);
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

/**
 * CARD-013/027: 예산·데이터 사용량을 몰라도, 관심사(예: "넷플릭스", "OTT")만으로
 * 그 혜택이 있는 요금제를 바로 찾아 보여준다 - "관련 상품 있나요?" 같은 정보성
 * 질문에 매번 예산부터 되묻지 않기 위함이다. 예산/데이터가 없으니 순위를 매길 축이
 * 없어서, 월 요금 오름차순(저렴한 것부터)으로만 정렬한다 - 임의로 등수를 매기지 않는다.
 */
function selectPlansByInterest(
  plans: Plan[],
  interests: string[],
): ScoredPlan[] {
  const matched = plans
    .filter((plan) => matchesMediaInterest(plan.benefits?.media_contents, interests))
    .sort((a, b) => a.monthlyFee - b.monthlyFee)
    .slice(0, MAX_INTEREST_BROWSE_RESULTS);

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
 * 예산·테더링은 "말했으면 반드시 지켜야 하는 조건"이라 순서대로 하드 필터로 거른다
 * (소프트 가중치로만 두면, 가중치가 작은 축은 다른 축 점수에 묻혀 사실상 무시될 수 있다 -
 * 예: 데이터 적합도가 워낙 높은 저가 요금제가, 테더링을 요구한 사용자에게도 1위로 뽑히는 문제).
 * 채워지지 않으면 그 단계만 완화하고(CARD-020) 이전 단계 결과는 유지한다.
 *
 * 1. 예산 필터 → 없으면 완화(전체 대상), didRelaxBudget = true
 * 2. (1의 결과에서) 테더링 필터 → 없으면 완화(1의 결과 유지), didRelaxTethering = true
 * 3. 남은 후보를 데이터 적합도(60%) + 예산 적합도(25%) + 테더링 적합도(15%)로 채점해
 *    내림차순 정렬 - 필터를 통과한 후보끼리 "더 딱 맞는" 순서를 가리는 타이브레이커다.
 * 4. 상위 3개까지 rank 1~3을 매겨 돌려준다.
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
    const byInterest = selectPlansByInterest(plans, conditions.interests);
    if (byInterest.length > 0) {
      return {
        recommendations: byInterest,
        didRelaxBudget: false,
        didRelaxTethering: false,
        isInterestBrowse: true,
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

  // 2단계: 테더링 (1단계를 통과한 후보 안에서만 거른다)
  const withinTethering = conditions.tetheringGb
    ? afterBudget.filter((item) => item.tetheringGb >= conditions.tetheringGb!)
    : afterBudget;
  const didRelaxTethering =
    Boolean(conditions.tetheringGb) && withinTethering.length === 0;
  const candidates = didRelaxTethering ? afterBudget : withinTethering;

  const scored = candidates
    .map(({ plan, dataGb, tetheringGb }) => {
      const fitScore = Math.round(
        scoreCapacityFit(dataGb, usageGb) * 0.6 +
          scoreBudgetFit(plan.monthlyFee, conditions.budget) * 0.25 +
          scoreCapacityFit(tetheringGb, conditions.tetheringGb ?? 0) * 0.15,
      );

      return {
        plan,
        fitScore,
        isWithinBudget:
          !conditions.budget || plan.monthlyFee <= conditions.budget,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);

  const recommendations = scored.slice(0, 3).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return { recommendations, didRelaxBudget, didRelaxTethering, isInterestBrowse: false };
}
