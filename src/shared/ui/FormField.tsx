import type { ReactNode } from 'react';

interface FormFieldProps {
  /** 라벨 문구 */
  label: string;
  /** 라벨이 가리킬 입력 요소의 id. 자식에 같은 id 를 준다 */
  htmlFor: string;
  /** AUTH-007: 항목별 오류 문구. 없으면 렌더하지 않는다 */
  error?: string;
  children: ReactNode;
}

/** 라벨 + 입력 + 오류 문구 한 벌. 폼 안에서 반복되는 껍데기를 맡는다 */
export default function FormField({
  label,
  htmlFor,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-12 font-medium text-text-main">
        {label}
      </label>

      {children}

      {error && <p className="text-12 text-semantic-error">{error}</p>}
    </div>
  );
}
