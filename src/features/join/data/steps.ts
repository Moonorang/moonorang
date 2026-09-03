/** 가입 절차 한 단계의 정의 - 종류별 단계 목록이 모두 이 모양이다 */
export interface JoinStep {
  id: string;
  /** 카드 머리에 적는 단계 이름 */
  title: string;
  /** 그 단계의 제출 버튼 문구 */
  submitLabel: string;
  /** 아직 화면이 없는 단계는 진행 표시줄에는 나오되 이동할 때 건너뛴다 */
  hasScreen: boolean;
  /** 거짓이면 진행 표시줄에 아예 안 나온다 */
  hasProgress: boolean;
}

/**
 * 요금제 가입 절차의 전체 단계 (CARD-031, CARD-032).
 * 진행 표시줄이 이 목록을 그대로 그리므로 단계가 늘거나 줄면 여기만 고치면 된다.
 *
 * hasScreen 이 false 인 단계는 요구사항에는 있으나 아직 화면이 없다.
 * 진행 표시줄에는 칸을 차지하되, 이동할 때는 건너뛴다. (지금은 전부 화면이 있다)
 *
 * submitLabel 은 그 단계의 제출 버튼 문구다 - 마지막 단계인지로 정하지 않고
 * 시안을 그대로 따른다(카드 등록도 '완료'다).
 *
 * hasProgress 가 false 인 단계는 진행 표시줄에 아예 안 나온다 - 상세 확인은
 * 고른 요금제가 맞는지 되묻는 자리라, 절차가 시작되기 전으로 본다.
 */
export const PLAN_JOIN_STEPS = [
  {
    id: 'plan',
    title: '상세 확인',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: false,
  },
  {
    id: 'terms',
    title: '약관 동의',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'identity',
    title: '본인 확인',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'card',
    title: '카드 등록',
    submitLabel: '완료',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'confirm',
    title: '결제 정보',
    submitLabel: '결제하기',
    hasScreen: true,
    hasProgress: true,
  },
] as const;

export type PlanJoinStepId = (typeof PLAN_JOIN_STEPS)[number]['id'];

/**
 * 부가서비스 가입 절차의 단계 (DATA-010).
 *
 * 요금제보다 짧은 이유는 이미 계약된 회선에 항목을 하나 얹는 일이기 때문이다 -
 * 본인 확인(CARD-035~037)과 카드 등록(CARD-038)은 회선을 새로 여는 요금제 가입의
 * 요구사항이고, 부가서비스는 이용 요금이 통신요금에 합산되므로(DATA-012) 결제
 * 수단을 따로 받지 않는다.
 */
export const ADD_ON_JOIN_STEPS = [
  {
    id: 'addOn',
    title: '상세 확인',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: false,
  },
  {
    id: 'terms',
    title: '유의사항 동의',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'confirm',
    title: '신청 확인',
    submitLabel: '신청하기',
    hasScreen: true,
    hasProgress: true,
  },
] as const;

export type AddOnJoinStepId = (typeof ADD_ON_JOIN_STEPS)[number]['id'];

/**
 * 구독 상품 가입 절차의 단계 (DATA-015).
 *
 * 부가서비스보다 한 단계 많은 이유는 결제 방식이 다르기 때문이다 - 부가서비스는
 * 통신요금에 합산되지만(DATA-012) 구독 상품은 매달 같은 날 따로 결제되므로
 * (DATA-017, user_subscriptions 는 "개별 결제") 결제 수단을 받아야 한다.
 * 요금제 가입의 카드 등록 화면(CardStep)을 그대로 쓴다.
 *
 * 본인 확인이 없는 것은 부가서비스와 같다 - 이미 계약된 회선에 얹는 일이라
 * 본인 확인을 다시 받을 이유가 없다.
 */
export const SUBSCRIPTION_JOIN_STEPS = [
  {
    id: 'subscription',
    title: '상세 확인',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: false,
  },
  {
    id: 'terms',
    title: '약관 동의',
    submitLabel: '다음',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'card',
    title: '결제 수단 등록',
    submitLabel: '완료',
    hasScreen: true,
    hasProgress: true,
  },
  {
    id: 'confirm',
    title: '신청 확인',
    submitLabel: '신청하기',
    hasScreen: true,
    hasProgress: true,
  },
] as const;

export type SubscriptionJoinStepId =
  (typeof SUBSCRIPTION_JOIN_STEPS)[number]['id'];
