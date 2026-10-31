import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';
import { FONT_SIZE_LIMITS } from '../../../../hooks/useTheme';
import styles from './FontSizeStepper.module.css';
import Button from '../../../../components/_core/button/Button';

type FontSizeStepperProps = {
  label: string;
  /** Px. */
  value: number;
  onChange: (value: number) => void;
};

/** One font size setting: its name, the current size and −/+ buttons that step it by a pixel. */
export function FontSizeStepper({ label, value, onChange }: Readonly<FontSizeStepperProps>) {
  const labelId = useId();

  return (
    <div
      className={styles.row}
      role="group"
      aria-labelledby={labelId}
    >
      <span
        id={labelId}
        className={styles.label}
      >
        {label}
      </span>
      <div className={styles.controls}>
        <Button
          type="button"
          className={styles.stepper}
          aria-label={`${label}: zmenšit`}
          disabled={value <= FONT_SIZE_LIMITS.min}
          onClick={() => onChange(value - 1)}
          icon={Minus}
        />
        <output
          className={styles.value}
          aria-live="polite"
        >
          {value} px
        </output>
        <Button
          type="button"
          className={styles.stepper}
          aria-label={`${label}: zvětšit`}
          disabled={value >= FONT_SIZE_LIMITS.max}
          onClick={() => onChange(value + 1)}
          icon={Plus}
        />
      </div>
    </div>
  );
}
