// add_ons.description 은 스키마 문서상 텍스트지만 실제 데이터는 jsonb 로 들어와 있다.
export interface AddOnDescription {
  guide?: string;
  features?: string[];
}

// 부가서비스 타입 add_ons 테이블 컬럼 반영
export interface AddOn {
  id: number;
  title: string;
  subTitle: string;
  baseMonthlyRate: number;
  description: AddOnDescription | null;
}
