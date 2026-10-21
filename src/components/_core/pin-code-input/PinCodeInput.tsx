import { PinInput } from '@ark-ui/react/pin-input';
import { useId } from 'react';
import { normalizePin, type PIN } from '../../../lib/pin';
import styles from './PinCodeInput.module.css';

type PinCodeInputProps = {
  value: PIN;
  onValueChange?: (value: PIN) => void;
  readOnly?: boolean;
  title?: string;
  description?: string;
  showLabel?: boolean;
  ariaLabelPrefix?: string;
};

export default function PinCodeInput({
  value,
  onValueChange,
  readOnly = false,
  title = 'Zadej 4-místný PIN',
  description = 'Pomocí PINu tě spojíme s otevřenou partou.',
  showLabel = true,
  ariaLabelPrefix = 'pin číslice',
}: Readonly<PinCodeInputProps>) {
  // React's ids contain characters jsdom's selector engine fails to match once escaped,
  // so typing in tests crashes inside Ark.
  const ids = { root: `pin-input-${useId().replace(/[^\w-]/g, '')}` };

  return (
    <PinInput.Root
      ids={ids}
      value={[...value]}
      count={value.length}
      className={styles.pinContainer}
      type="numeric"
      readOnly={readOnly}
      onValueChange={(details) => onValueChange?.(normalizePin(details.value))}
    >
      {showLabel && (
        <PinInput.Label className={styles.pinLabel}>
          <span className={styles.pinTitle}>{title}</span>
          <span className={styles.pinDescription}>{description}</span>
        </PinInput.Label>
      )}

      <PinInput.Control className={styles.pinControl}>
        {value.map((_, i) => (
          <PinInput.Input
            key={i} // NOSONAR: fixed-length positional slots, never reordered
            className={styles.pinInput}
            index={i}
            placeholder=""
            aria-label={`${ariaLabelPrefix} ${i + 1}`}
          />
        ))}
      </PinInput.Control>

      <PinInput.HiddenInput />
    </PinInput.Root>
  );
}
