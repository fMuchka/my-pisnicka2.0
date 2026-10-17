import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Checkbox from '../Checkbox.vue';

describe('Checkbox', () => {
  it('renders a labelled checkbox reflecting modelValue', () => {
    render(Checkbox, { props: { label: 'Zapamatovat si mě', modelValue: true } });

    expect(screen.getByRole('checkbox', { name: 'Zapamatovat si mě' })).toBeChecked();
  });

  it('emits the toggled value when the label is clicked', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Checkbox, { props: { label: 'Posílat novinky' } });

    await user.click(screen.getByText('Posílat novinky'));

    expect(emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Checkbox, { props: { label: 'Posílat novinky' } });

    await user.tab();
    await user.keyboard(' ');

    expect(emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Checkbox, {
      props: { label: 'Nedostupné pro tento účet', disabled: true },
    });

    expect(screen.getByRole('checkbox', { name: 'Nedostupné pro tento účet' })).toBeDisabled();
    await user.click(screen.getByText('Nedostupné pro tento účet'));

    expect(emitted('update:modelValue')).toBeUndefined();
  });

  it('applies the chip variant', () => {
    const { container } = render(Checkbox, { props: { label: 'C dur', variant: 'chip' } });

    expect(container.firstElementChild).toHaveClass('checkbox--chip');
  });

  it('passes name and value to the form input', () => {
    render(Checkbox, { props: { label: 'C dur', name: 'chords', value: 'C' } });

    const input = screen.getByRole('checkbox', { name: 'C dur' });
    expect(input).toHaveAttribute('name', 'chords');
    expect(input).toHaveAttribute('value', 'C');
  });
});
