// 취미 성향 검사 (TEST-001~012)
//
// 원래는 요금제 이용 성향을 진단하던 검사였는데, 대화 중간에 가볍게 즐기는
// 오락 요소로 방향을 바꿨다. 그래서 측정하는 축도 데이터·통화·예산이 아니라
// 휴식과 취미·여가를 어떻게 보내는지다.

// 성향 유형 식별자 - 쉴 때 덜 움직이는 순서
export type LeisureTypeId = 'jamjam' | 'daily' | 'pop' | 'super';

// 맞춤 혜택 아이콘 종류 (lucide 아이콘에 매핑)
export type BenefitIcon = 'monitor' | 'wifi' | 'shield';

// 문항 선택지 - score 는 1~4, 클수록 밖에서 활동적으로 쉬는 쪽이다
export interface TestOption {
  score: number;
  label: string;
  /**
   * 이 선택지가 뜻하는 취미 키워드.
   * 결과 화면에 그대로 보여주고, 로그인 사용자면 활동 로그에도 함께 남긴다.
   */
  keyword: string;
}

// 성향 검사 문항 (TEST-002: 5문항 객관식)
export interface TestQuestion {
  id: number;
  question: string;
  options: TestOption[];
}

// 결과 화면에 노출할 맞춤 혜택
export interface TestBenefit {
  icon: BenefitIcon;
  title: string;
  description: string;
}

// 성향 유형 정의 (TEST-006 의 "사전에 정의된 기준")
export interface LeisureType {
  id: LeisureTypeId;
  name: string;
  description: string;
  imageSrc: string;
  // 유형 판정 점수 구간 - 양끝 포함
  minScore: number;
  maxScore: number;
  benefits: TestBenefit[];
}

// 진단 결과 (TEST-007)
export interface Diagnosis {
  type: LeisureType;
  // 다섯 문항 점수의 합 (5~20)
  typeScore: number;
  // 고른 선택지들의 취미 키워드 (건너뛴 문항은 빠진다)
  keywords: string[];
}
