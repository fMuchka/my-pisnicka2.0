import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import styles from './RadioGroup.module.css';
import type { RadioOption } from './types';

type RadioGroupProps = {
  options: RadioOption[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  label?: string | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
};

export default function RadioGroup({
  options,
  value,
  defaultValue = '',
  onValueChange,
  label,
  disabled,
  name,
}: RadioGroupProps) {
  return (
    <ArkRadioGroup.Root
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      className={styles.radioGroup}
      onValueChange={(details) => onValueChange?.(details.value ?? '')}
    >
      {label && (
        <ArkRadioGroup.Label className={styles.radioGroupLabel}>{label}</ArkRadioGroup.Label>
      )}

      {options.map((option) => (
        <ArkRadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={styles.radio}
        >
          <ArkRadioGroup.ItemControl className={styles.radioControl} />
          <ArkRadioGroup.ItemText className={styles.radioText}>
            {option.label}
          </ArkRadioGroup.ItemText>
          <ArkRadioGroup.ItemHiddenInput />
        </ArkRadioGroup.Item>
      ))}
    </ArkRadioGroup.Root>
  );
}
