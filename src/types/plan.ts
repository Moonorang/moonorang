// 요금제 타입
export interface Plan {
  id: string;
  name: string;
  // 월 요금
  monthlyFee: number;
  // 데이터 제공량
  data: string;
  // 음성 제공량
  voice: string;
  // 문자 제공량
  sms: string;
  // 데이터 소진 후 속도
  speed: string;
  // 쉐어링
  sharing: string;
}
