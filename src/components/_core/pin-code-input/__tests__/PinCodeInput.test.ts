import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h, ref } from 'vue';
import { emptyPin, stringToPin, type PIN } from '../../../../lib/pin';
import PinCodeInput from '../PinCodeInput.vue';

const digitInputs = () => screen.getAllByRole('textbox', { name: /pin číslice/i });
const firstDigit = () => digitInputs()[0] as HTMLElement;

// The component is controlled, so typing only sticks when the parent feeds the value back.
const renderWithModel = () => {
  const pin = ref<PIN>(emptyPin());
  render(
    defineComponent({
      setup: () => () =>
        h(PinCodeInput, {
          modelValue: pin.value,
          'onUpdate:modelValue': (value: PIN) => (pin.value = value),
        }),
    })
  );
  return pin;
};

describe('PinCodeInput', () => {
  it('renders four labelled digit inputs', () => {
    render(PinCodeInput, { props: { modelValue: emptyPin() } });

    const inputs = digitInputs();
    expect(inputs).toHaveLength(4);
    expect(inputs[0]).toHaveAccessibleName('pin číslice 1');
    expect(inputs[3]).toHaveAccessibleName('pin číslice 4');
  });

  it('shows the title and description by default', () => {
    render(PinCodeInput, {
      props: { modelValue: emptyPin(), title: 'Zadej PIN', description: 'Od kamaráda' },
    });

    expect(screen.getByText('Zadej PIN')).toBeInTheDocument();
    expect(screen.getByText('Od kamaráda')).toBeInTheDocument();
  });

  it('hides the label when showLabel is false', () => {
    render(PinCodeInput, {
      props: { modelValue: emptyPin(), showLabel: false, title: 'Zadej PIN' },
    });

    expect(screen.queryByText('Zadej PIN')).not.toBeInTheDocument();
  });

  it('uses a custom aria label prefix', () => {
    render(PinCodeInput, { props: { modelValue: emptyPin(), ariaLabelPrefix: 'číslo' } });

    expect(screen.getByRole('textbox', { name: 'číslo 2' })).toBeInTheDocument();
  });

  it('displays the digits of the current value', () => {
    render(PinCodeInput, { props: { modelValue: stringToPin('4821') } });

    expect(digitInputs().map((input) => (input as HTMLInputElement).value)).toEqual([
      '4',
      '8',
      '2',
      '1',
    ]);
  });

  it('emits the typed digits as a four-slot PIN', async () => {
    const user = userEvent.setup();
    const pin = renderWithModel();

    await user.type(firstDigit(), '1');
    await user.type(digitInputs()[1] as HTMLElement, '2');

    await waitFor(() => expect(pin.value).toEqual(['1', '2', '', '']));
  });

  it('ignores non-numeric input', async () => {
    const user = userEvent.setup();
    const { emitted } = render(PinCodeInput, { props: { modelValue: emptyPin() } });

    await user.click(firstDigit());
    await user.keyboard('a');

    expect(emitted('update:modelValue')).toBeUndefined();
  });

  it('does not change the value when read-only', async () => {
    const user = userEvent.setup();
    const { emitted } = render(PinCodeInput, {
      props: { modelValue: stringToPin('4821'), readOnly: true },
    });

    for (const input of digitInputs()) {
      expect(input).toHaveAttribute('readonly');
    }

    await user.click(firstDigit());
    await user.keyboard('9');

    expect(emitted('update:modelValue')).toBeUndefined();
  });
});
