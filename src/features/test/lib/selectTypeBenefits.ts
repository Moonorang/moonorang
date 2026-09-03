import type { AddOn } from '@/entities/addOn/types';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { Plan } from '@/entities/plan/types';
import { formatWon } from '@/shared/utils/formatCurrency';

import { TYPE_BENEFIT_SOURCES } from '@/features/test/data/typeBenefitSources';
import type { LeisureTypeId, TestBenefit } from '@/features/test/types';

type BenefitIconOf = TestBenefit['icon'];

/** 결과 화면에 세울 줄 수 - 첫 줄은 요금제, 나머지는 혜택이다 */
const MAX_RESULTS = 3;

/**
 * 여러 줄짜리 안내에서 첫 줄만 쓴다.
 * summary 나 provided_count 에는 예외 조건이 줄바꿈으로 딸려 오는데(GS25 의 등급별
 * 할인, CGV 의 쿠폰 소진 안내 등), 결과 화면은 한눈에 읽는 자리라 첫 줄이면 충분하다.
 */
function firstLine(text: string): string {
  return text.split('\n')[0].trim();
}

function countMatches(text: string, keywords: string[]): number {
  const lowered = text.toLowerCase();

  return keywords.filter((keyword) => lowered.includes(keyword.toLowerCase()))
    .length;
}

/** 요금제에서 낱말을 찾을 때 훑는 글자 - 혜택 값에 브랜드명이 그대로 들어 있다 */
function toPlanText(plan: Plan): string {
  return [plan.name, plan.description, ...Object.values(plan.benefits ?? {})]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

/**
 * 첫 줄에 세울 요금제 한 개.
 *
 * 유형 낱말이 많이 걸리는 요금제를 고르고, 같으면 들어온 순서(요금 오름차순)를
 * 따라 저렴한 쪽을 남긴다. 설명 줄에는 그 유형이 눈여겨보는 혜택을 적는다 -
 * 없으면 요금제가 내세우는 최대 혜택 금액으로 대신한다.
 */
function toPlanBenefit(
  plans: Plan[],
  typeId: LeisureTypeId,
): TestBenefit | null {
  const { planKeywords, planBenefitKeys, icons } = TYPE_BENEFIT_SOURCES[typeId];

  if (plans.length === 0) return null;

  const [best] = [...plans].sort(
    (a, b) =>
      countMatches(toPlanText(b), planKeywords) -
      countMatches(toPlanText(a), planKeywords),
  );

  const headline =
    planBenefitKeys
      .map((key) => best.benefits?.[key])
      .find((text): text is string => Boolean(text)) ??
    (best.benefits?.max_benefit_value
      ? `최대 ${best.benefits.max_benefit_value} 상당 혜택`
      : null);

  return {
    icon: icons[0],
    title: `${best.name} · 월 ${formatWon(best.monthlyFee)}원`,
    description: headline ?? '취미 성향에 맞는 요금제',
  };
}

/** 이 카테고리의 멤버십 브랜드를 혜택 한 줄로 - 할인 문구가 없으면 적지 않는다 */
function toMembershipBenefit(
  brand: MembershipBrand,
  icon: BenefitIconOf,
): TestBenefit | null {
  const summary = brand.discountRules?.summary;

  if (!summary) return null;

  const providedCount = brand.discountRules?.detail?.provided_count;

  return {
    icon,
    title: `${brand.name} ${firstLine(summary)}`,
    description: providedCount
      ? `U+ 멤버십 혜택 · ${firstLine(providedCount)}`
      : 'U+ 멤버십 혜택',
  };
}

/**
 * TEST-007: 진단된 유형에 어울리는 요금제와 혜택을 고른다.
 *
 * 첫 줄은 요금제, 나머지 두 줄은 혜택이다. 혜택은 지금 요금제 그대로 누리는 것부터
 * 채운다 - U+ 멤버십 제휴 할인, 취미형 부가서비스 순이고, 그래도 자리가 남으면
 * 첫 줄 요금제가 들고 있는 다른 혜택 문구로 마저 채운다.
 *
 * 어디서 찾을지는 data/typeBenefitSources 에 적혀 있고, 문구와 금액은 DB 값을
 * 그대로 쓴다. 판정과 마찬가지로 순수 함수라 같은 유형이면 언제나 같은 목록이다.
 */
export function selectTypeBenefits(
  plans: Plan[],
  brands: MembershipBrand[],
  addOns: AddOn[],
  typeId: LeisureTypeId,
  max: number = MAX_RESULTS,
): TestBenefit[] {
  const source = TYPE_BENEFIT_SOURCES[typeId];
  const results: TestBenefit[] = [];

  // 1. 첫 줄 - 어울리는 요금제
  const planBenefit = toPlanBenefit(plans, typeId);
  if (planBenefit) results.push(planBenefit);

  // 2. 멤버십 제휴 할인
  for (const category of source.membershipCategories) {
    if (results.length >= max) break;

    const brand = brands.find((candidate) => candidate.category === category);
    const benefit = brand
      ? toMembershipBenefit(brand, source.icons[results.length])
      : null;

    if (benefit) results.push(benefit);
  }

  // 3. 취미형 부가서비스
  for (const keyword of source.addOnKeywords) {
    if (results.length >= max) break;

    const addOn = addOns.find((candidate) =>
      candidate.title.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (addOn) {
      results.push({
        icon: source.icons[results.length],
        title: addOn.title,
        description: `${addOn.subTitle} · 월 ${formatWon(addOn.baseMonthlyRate)}원`,
      });
    }
  }

  // 4. 그래도 모자라면 첫 줄 요금제의 다른 혜택으로 채운다
  const [bestPlan] = [...plans].sort(
    (a, b) =>
      countMatches(toPlanText(b), source.planKeywords) -
      countMatches(toPlanText(a), source.planKeywords),
  );
  const used = new Set(results.map((benefit) => benefit.description));

  for (const [key, text] of Object.entries(bestPlan?.benefits ?? {})) {
    if (results.length >= max) break;
    // 첫 줄에 이미 쓴 혜택과, 값만 있고 뜻이 약한 칸은 건너뛴다
    if (!text || used.has(text)) continue;
    if (key === 'max_benefit_value' || key === 'tethering_sharing') continue;

    used.add(text);
    results.push({
      icon: source.icons[results.length],
      title: text,
      description: `${bestPlan.name} 요금제 혜택`,
    });
  }

  return results.slice(0, max);
}
