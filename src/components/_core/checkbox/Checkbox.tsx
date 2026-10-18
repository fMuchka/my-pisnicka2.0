import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cx } from '../cx';
import styles from './Checkbox.module.css';
import type { CheckboxVariant } from './types';

type CheckboxProps = {
  label: string;
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  variant?: CheckboxVariant | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  value?: string | undefined;
};

export default function Checkbox({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  variant = 'default',
  disabled,
  name,
  value,
}: CheckboxProps) {
  return (
    <ArkCheckbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      name={name}
      value={value}
      className={cx(styles.checkbox, variant === 'chip' && styles.checkboxChip)}
      onCheckedChange={(details) => onCheckedChange?.(details.checked === true)}
    >
      <ArkCheckbox.Control className={styles.checkboxBox}>
        <ArkCheckbox.Indicator className={styles.checkboxIndicator}>
          <Check aria-hidden="true" />
        </ArkCheckbox.Indicator>
      </ArkCheckbox.Control>
      <ArkCheckbox.Label className={styles.checkboxLabel}>{label}</ArkCheckbox.Label>
      <ArkCheckbox.HiddenInput />
    </ArkCheckbox.Root>
  );
}
