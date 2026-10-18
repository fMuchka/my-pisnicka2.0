import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { emptyPin, stringToPin, type PIN } from '../../../../lib/pin';
import PinCodeInput from '../PinCodeInput';

const digitInputs = () => screen.getAllByRole('textbox', { name: /pin číslice/i });
const firstDigit = () => digitInputs()[0] as HTMLElement;

// The component is controlled, so typing only sticks when the parent feeds the value back.
const renderWithState = () => {
  const latest = { pin: emptyPin() };

  function Harness() {
    const [pin, setPin] = useState<PIN>(emptyPin());
    latest.pin = pin;
    return (
      <PinCodeInput
        value={pin}
        onValueChange={setPin}
      />
    );
  }

  render(<Harness />);
  return latest;
};

describe('PinCodeInput', () => {
  it('renders four labelled digit inputs', () => {
    render(<PinCodeInput value={emptyPin()} />);

    const inputs = digitInputs();
    expect(inputs).toHaveLength(4);
    expect(inputs[0]).toHaveAccessibleName('pin číslice 1');
    expect(inputs[3]).toHaveAccessibleName('pin číslice 4');
  });

  it('shows the title and description by default', () => {
    render(
      <PinCodeInput
        value={emptyPin()}
        title="Zadej PIN"
        description="Od kamaráda"
      />
    );

    expect(screen.getByText('Zadej PIN')).toBeInTheDocument();
    expect(screen.getByText('Od kamaráda')).toBeInTheDocument();
  });

  it('hides the label when showLabel is false', () => {
    render(
      <PinCodeInput
        value={emptyPin()}
        showLabel={false}
        title="Zadej PIN"
      />
    );

    expect(screen.queryByText('Zadej PIN')).not.toBeInTheDocument();
  });

  it('uses a custom aria label prefix', () => {
    render(
      <PinCodeInput
        value={emptyPin()}
        ariaLabelPrefix="číslo"
      />
    );

    expect(screen.getByRole('textbox', { name: 'číslo 2' })).toBeInTheDocument();
  });

  it('displays the digits of the current value', () => {
    render(<PinCodeInput value={stringToPin('4821')} />);

    expect(digitInputs().map((input) => (input as HTMLInputElement).value)).toEqual([
      '4',
      '8',
      '2',
      '1',
    ]);
  });

  it('reports the typed digits as a four-slot PIN', async () => {
    const user = userEvent.setup();
    const latest = renderWithState();

    await user.type(firstDigit(), '1');
    await user.type(digitInputs()[1] as HTMLElement, '2');

    await waitFor(() => expect(latest.pin).toEqual(['1', '2', '', '']));
  });

  // Rejecting non-digits is covered in tests/e2e/storybook/pin-code-input.spec.ts: jsdom can't trigger it.

  it('does not change the value when read-only', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PinCodeInput
        value={stringToPin('4821')}
        readOnly
        onValueChange={onValueChange}
      />
    );

    for (const input of digitInputs()) {
      expect(input).toHaveAttribute('readonly');
    }

    await user.click(firstDigit());
    await user.keyboard('9');

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
