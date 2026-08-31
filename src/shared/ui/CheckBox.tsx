'use client';

import { Check } from 'lucide-react';

interface CheckBoxProps {
  /** 짝이 되는 label 이 가리킬 id */
  id: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  /** 옆에 label 을 두지 않을 때 보조기술이 읽을 이름 */
  ariaLabel?: string;
}

/**
 * 네모 체크박스. 네이티브 input 위에 체크 표시만 겹쳐 그린다 -
 * 키보드 조작과 보조기술 대응을 브라우저에 그대로 맡기기 위해서다.
 */
export default function CheckBox({
  id,
  isChecked,
  onChange,
  ariaLabel,
}: CheckBoxProps) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-sm border border-border-default bg-background-default transition-colors checked:border-action-secondary checked:bg-action-secondary"
      />

      {/* 클릭은 아래 input 이 받는다 */}
      <Check
        size={14}
        aria-hidden
        className="pointer-events-none relative text-background-default opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}
