import { SegmentGroup as ArkSegmentGroup } from '@ark-ui/react/segment-group';
import styles from './SegmentGroup.module.css';
import type { SegmentOption } from './types';

type SegmentGroupProps = {
  options: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Visible label above the segments; use `aria-label` instead when the context already names it. */
  label?: string;
  'aria-label'?: string;
  disabled?: boolean;
  name?: string;
};

/** Pick one of a few options, styled like the pill tabs. For switching content panels, use Tabs. */
export default function SegmentGroup({
  options,
  value,
  defaultValue = '',
  onValueChange,
  label,
  'aria-label': ariaLabel,
  disabled,
  name,
}: Readonly<SegmentGroupProps>) {
  return (
    <ArkSegmentGroup.Root
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      className={styles.segmentGroup}
      aria-label={label ? undefined : ariaLabel}
      onValueChange={(details) => onValueChange?.(details.value ?? '')}
    >
      {label && (
        <ArkSegmentGroup.Label className={styles.segmentGroupLabel}>{label}</ArkSegmentGroup.Label>
      )}

      <div
        className={styles.segments}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <ArkSegmentGroup.Indicator className={styles.segmentIndicator} />

        {options.map(({ value: optionValue, label: optionLabel, icon: Icon, disabled }) => (
          <ArkSegmentGroup.Item
            key={optionValue}
            value={optionValue}
            disabled={disabled}
            className={styles.segment}
          >
            <ArkSegmentGroup.ItemText className={styles.segmentText}>
              {Icon && (
                <Icon
                  className={styles.segmentIcon}
                  aria-hidden="true"
                />
              )}
              {optionLabel}
            </ArkSegmentGroup.ItemText>
            <ArkSegmentGroup.ItemControl />
            <ArkSegmentGroup.ItemHiddenInput />
          </ArkSegmentGroup.Item>
        ))}
      </div>
    </ArkSegmentGroup.Root>
  );
}
