/**
 * 요금제 가입 절차의 전체 단계 (CARD-031, CARD-032).
 * 진행 표시줄이 이 목록을 그대로 그리므로 단계가 늘거나 줄면 여기만 고치면 된다.
 *
 * hasScreen 이 false 인 단계는 요구사항에는 있으나 아직 화면이 없다.
 * 진행 표시줄에는 칸을 차지하되, 이동할 때는 건너뛴다.
 */
export const JOIN_STEPS = [
  { id: 'plan', title: '상세 확인', hasScreen: true },
  { id: 'terms', title: '약관 동의', hasScreen: true },
  { id: 'identity', title: '본인 확인', hasScreen: true },
  { id: 'card', title: '카드 등록', hasScreen: true },
  { id: 'confirm', title: '최종 확인', hasScreen: false },
] as const;

export type JoinStepId = (typeof JOIN_STEPS)[number]['id'];
