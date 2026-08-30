import type { ComponentPropsWithRef } from 'react';

import { ChevronDown } from 'lucide-react';

import {
  FIELD_BASE_CLASS,
  FIELD_ICON_SIZE,
  FIELD_SELECT_PADDING,
  FIELD_SIZE_STYLES,
  type FieldSize,
} from '@/shared/ui/fieldSize';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps extends Omit<
  ComponentPropsWithRef<'select'>,
  'size' | 'className' | 'children'
> {
  size?: FieldSize;
  isInvalid?: boolean;
  options: SelectOption[];
  /** 선택 전에 보여줄 안내 문구 */
  placeholder?: string;
  /** 아직 아무것도 고르지 않았으면 true - 안내 문구를 흐리게 보여준다 */
  isPlaceholder?: boolean;
}

export default function SelectField({
  size = 'md',
  isInvalid = false,
  options,
  placeholder,
  isPlaceholder = false,
  ...props
}: SelectFieldProps) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={isInvalid || undefined}
        className={[
          FIELD_BASE_CLASS,
          FIELD_SIZE_STYLES[size],
          FIELD_SELECT_PADDING[size],
          'appearance-none',
          isPlaceholder ? 'text-text-secondary' : '',
        ].join(' ')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={FIELD_ICON_SIZE[size]}
        strokeWidth={1.5}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-main"
      />
    </div>
  );
}
