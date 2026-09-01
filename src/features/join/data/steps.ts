/**
 * 요금제 가입 절차의 전체 단계 (CARD-031, CARD-032).
 * 진행 표시줄이 이 목록을 그대로 그리므로 단계가 늘거나 줄면 여기만 고치면 된다.
 *
 * hasScreen 이 false 인 단계는 요구사항에는 있으나 아직 화면이 없다.
 * 진행 표시줄에는 칸을 차지하되, 이동할 때는 건너뛴다.
 *
 * hasProgress 가 false 인 단계는 진행 표시줄에 아예 안 나온다 - 상세 확인은
 * 고른 요금제가 맞는지 되묻는 자리라, 절차가 시작되기 전으로 본다.
 */
export const JOIN_STEPS = [
  { id: 'plan', title: '상세 확인', hasScreen: true, hasProgress: false },
  { id: 'terms', title: '약관 동의', hasScreen: true, hasProgress: true },
  { id: 'identity', title: '본인 확인', hasScreen: true, hasProgress: true },
  { id: 'card', title: '카드 등록', hasScreen: true, hasProgress: true },
  { id: 'confirm', title: '최종 확인', hasScreen: false, hasProgress: true },
] as const;

export type JoinStepId = (typeof JOIN_STEPS)[number]['id'];
