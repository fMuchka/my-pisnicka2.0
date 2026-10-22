import { Field } from '@ark-ui/react/field';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cx } from '../cx';
import FieldMessages from '../field/FieldMessages';
import fieldStyles from '../field/field.module.css';
import { useControllableState } from '../../../hooks/useControllableState';
import styles from './Select.module.css';
import type { SelectOption } from './types';

// Remaining props (name, aria-label, …) go to the <select>, not the wrapper.
type SelectProps = Omit<
  ComponentProps<'select'>,
  'value' | 'defaultValue' | 'onChange' | 'disabled' | 'required' | 'children'
> & {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export default function Select({
  options,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  label,
  placeholder,
  helperText,
  errorText,
  invalid,
  disabled,
  required,
  className,
  ...selectProps
}: Readonly<SelectProps>) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);

  return (
    <Field.Root
      className={fieldStyles.field}
      invalid={invalid}
      disabled={disabled}
      required={required}
    >
      {label && (
        <Field.Label className={fieldStyles.fieldLabel}>
          {label}
          <Field.RequiredIndicator className={fieldStyles.fieldRequired}>*</Field.RequiredIndicator>
        </Field.Label>
      )}

      <div className={fieldStyles.fieldControl}>
        {/* Native <select> on purpose: phones open their own picker, which beats any custom dropdown. */}
        <Field.Select
          {...selectProps}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cx(
            fieldStyles.fieldInput,
            styles.select,
            value === '' && styles.selectPlaceholder,
            className
          )}
        >
          {placeholder && (
            <option
              value=""
              disabled
            >
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </Field.Select>
        <ChevronDown
          className={styles.selectChevron}
          aria-hidden="true"
        />
      </div>

      <FieldMessages
        helperText={helperText}
        errorText={errorText}
        invalid={invalid}
      />
    </Field.Root>
  );
}
