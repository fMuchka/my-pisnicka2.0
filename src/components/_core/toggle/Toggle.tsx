import { Switch } from '@ark-ui/react/switch';
import styles from './Toggle.module.css';

type ToggleProps = {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  name?: string;
};

export default function Toggle({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  description,
  disabled,
  name,
}: Readonly<ToggleProps>) {
  return (
    <Switch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      name={name}
      className={styles.toggle}
      onCheckedChange={(details) => onCheckedChange?.(details.checked)}
    >
      <Switch.Label className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleDescription}>{description}</span>}
      </Switch.Label>
      <Switch.Control className={styles.toggleTrack}>
        <Switch.Thumb className={styles.toggleThumb} />
      </Switch.Control>
      {/* Ark exposes a plain checkbox; "switch" makes screen readers announce on/off. */}
      <Switch.HiddenInput role="switch" />
    </Switch.Root>
  );
}
