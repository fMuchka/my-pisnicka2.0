import { useState } from 'react';

/**
 * Lets a component be used both controlled (`value` + `onValueChange`) and uncontrolled
 * (no `value`; it keeps its own state) — the React side of Vue's `defineModel`.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onValueChange?: (value: T) => void
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;

  const setValue = (next: T) => {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  return [isControlled ? value : uncontrolledValue, setValue] as const;
}
