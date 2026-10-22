import { Field } from '@ark-ui/react/field';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { cx } from '../cx';
import FieldMessages from '../field/FieldMessages';
import fieldStyles from '../field/field.module.css';
import { useControllableState } from '../../../hooks/useControllableState';
import styles from './Input.module.css';
import type { InputType } from './types';
import type { Icon } from '../types';

// Remaining props (name, autoComplete, aria-label, …) go to the <input>, not the wrapper.
type InputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'disabled' | 'readOnly' | 'required'
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  type?: InputType;
  helperText?: string;
  errorText?: string;
  successText?: string;
  invalid?: boolean;
  success?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  prependIcon?: Icon;
};

export default function Input({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  label,
  type = 'text',
  helperText,
  errorText,
  successText,
  invalid,
  success,
  disabled,
  readOnly,
  required,
  prependIcon: PrependIcon,
  className,
  ...inputProps
}: Readonly<InputProps>) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && isPasswordVisible ? 'text' : type;
  const isSuccess = success && !invalid;

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

      <div className={fieldStyles.fieldControl}>
        {PrependIcon && (
          <PrependIcon
            className={styles.inputPrependIcon}
            aria-hidden="true"
          />
        )}
        <Field.Input
          {...inputProps}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type={inputType}
          className={cx(
            fieldStyles.fieldInput,
            isSuccess && fieldStyles.fieldInputSuccess,
            PrependIcon && styles.inputWithPrepend,
            isPassword && styles.inputWithAppend,
            className
          )}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.inputVisibility}
            aria-label={isPasswordVisible ? 'Skrýt heslo' : 'Zobrazit heslo'}
            aria-pressed={isPasswordVisible}
            disabled={disabled}
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        )}
      </div>

      <FieldMessages
        helperText={helperText}
        errorText={errorText}
        successText={successText}
        invalid={invalid}
        success={success}
      />
    </Field.Root>
  );
}
