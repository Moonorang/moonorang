'use client';

import { useEffect, useRef } from 'react';

import JsBarcode from 'jsbarcode';

/**
 * 멤버십 번호가 아직 DB 에 없어서 쓰는 예시 값.
 * 컬럼이 생기면 이 상수 대신 그 값을 prop 으로 넘기면 된다.
 */
const SAMPLE_MEMBERSHIP_NUMBER = '9412345678901';

interface MembershipBarcodeCardProps {
  membershipNumber?: string;
}

/**
 * PERSONAL-005 자리: 매장에서 찍는 멤버십 바코드.
 *
 * 이미지를 두지 않고 jsbarcode 로 그린다 - 번호만 바뀌면 되고, SVG 라 어느 화면
 * 크기에서도 선이 뭉개지지 않는다. 선 색은 currentColor 라 토큰을 그대로 따른다.
 */
export default function MembershipBarcodeCard({
  membershipNumber = SAMPLE_MEMBERSHIP_NUMBER,
}: MembershipBarcodeCardProps) {
  // 1. 상태 및 훅
  const barcodeRef = useRef<SVGSVGElement>(null);

  // 2. 부수 효과
  useEffect(() => {
    if (!barcodeRef.current) return;

    JsBarcode(barcodeRef.current, membershipNumber, {
      format: 'CODE128',
      width: 2,
      height: 56,
      margin: 0,
      displayValue: true,
      fontSize: 12,
      textMargin: 4,
      lineColor: 'currentColor',
      background: 'transparent',
    });
  }, [membershipNumber]);

  // 3. 렌더링
  return (
    <section className="flex flex-col rounded-md bg-background-default p-4 shadow-default">
      <h2 className="text-14 font-medium text-text-primary">멤버십 바코드</h2>

      <div className="mt-4 flex justify-center text-text-primary">
        <svg
          ref={barcodeRef}
          role="img"
          aria-label={`멤버십 바코드 ${membershipNumber}`}
          className="max-w-full"
        />
      </div>
    </section>
  );
}
