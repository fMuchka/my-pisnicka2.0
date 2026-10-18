import { Field } from '@ark-ui/react/field';
import type { ComponentProps } from 'react';
import { cx } from '../cx';
import FieldMessages from '../field/FieldMessages';
import fieldStyles from '../field/field.module.css';
import { useControllableState } from '../useControllableState';
import styles from './Textarea.module.css';

// Remaining props (name, aria-label, …) go to the <textarea>, not the wrapper.
type TextareaProps = Omit<
  ComponentProps<'textarea'>,
  'value' | 'defaultValue' | 'onChange' | 'disabled' | 'readOnly' | 'required' | 'maxLength'
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  label?: string | undefined;
  helperText?: string | undefined;
  errorText?: string | undefined;
  invalid?: boolean | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  maxLength?: number | undefined;
};

export default function Textarea({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  label,
  helperText,
  errorText,
  invalid,
  disabled,
  readOnly,
  required,
  rows = 3,
  maxLength,
  className,
  ...textareaProps
}: TextareaProps) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const counter = maxLength == null ? undefined : `${value.length} / ${maxLength}`;

  return (
    <Field.Root
      className={fieldStyles.field}
      invalid={invalid}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
    >
      {label && (
        <Field.Label className={fieldStyles.fieldLabel}>
          {label}
          <Field.RequiredIndicator className={fieldStyles.fieldRequired}>*</Field.RequiredIndicator>
        </Field.Label>
      )}

      <Field.Textarea
        {...textareaProps}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={cx(fieldStyles.fieldInput, styles.textarea, className)}
        rows={rows}
        maxLength={maxLength}
      />

      <FieldMessages
        helperText={helperText}
        errorText={errorText}
        invalid={invalid}
        counter={counter}
      />
    </Field.Root>
  );
}
