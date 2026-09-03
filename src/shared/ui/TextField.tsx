import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import {
  FIELD_BASE_CLASS,
  FIELD_SIZE_STYLES,
  type FieldSize,
} from '@/shared/ui/fieldSize';
import { applyMask } from '@/shared/utils/applyMask';

// 네이티브 input 의 size(글자 수 기준 폭)는 쓰지 않으므로 크기 토큰이 그 이름을 가져간다.
// className 은 받지 않는다 - 모양은 props 로만, 배치는 감싸는 요소로.
interface TextFieldProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'className'
> {
  size?: FieldSize;
  /** AUTH-007: 오류 상태를 보조기술에 알린다 */
  isInvalid?: boolean;
  /** 입력할 때마다 적용할 표시 형식. 커서 위치는 보존된다 */
  format?: (value: string) => string;
}

export default function TextField({
  size = 'md',
  isInvalid = false,
  format,
  onChange,
  ...props
}: TextFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (format) applyMask(event.target, format);

    onChange?.(event);
  };

  return (
    <input
      {...props}
      onChange={handleChange}
      aria-invalid={isInvalid || undefined}
      className={`${FIELD_BASE_CLASS} ${FIELD_SIZE_STYLES[size]}`}
    />
  );
}
