import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders a labelled checkbox reflecting checked', () => {
    render(
      <Checkbox
        label="Zapamatovat si mě"
        checked
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Zapamatovat si mě' })).toBeChecked();
  });

  it('reports the toggled value when the label is clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="Posílat novinky"
        onCheckedChange={onCheckedChange}
      />
    );

    await user.click(screen.getByText('Posílat novinky'));

    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="Posílat novinky"
        onCheckedChange={onCheckedChange}
      />
    );

    await user.tab();
    await user.keyboard(' ');

    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="Nedostupné pro tento účet"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Nedostupné pro tento účet' })).toBeDisabled();
    await user.click(screen.getByText('Nedostupné pro tento účet'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('applies the chip variant', () => {
    const { container } = render(
      <Checkbox
        label="C dur"
        variant="chip"
      />
    );

    expect(container.firstElementChild).toHaveClass('checkbox--chip');
  });

  it('passes name and value to the form input', () => {
    render(
      <Checkbox
        label="C dur"
        name="chords"
        value="C"
      />
    );

    const input = screen.getByRole('checkbox', { name: 'C dur' });
    expect(input).toHaveAttribute('name', 'chords');
    expect(input).toHaveAttribute('value', 'C');
  });
});
