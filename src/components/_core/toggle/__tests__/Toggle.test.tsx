import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toggle from '../Toggle';

describe('Toggle', () => {
  it('renders a labelled switch reflecting checked', () => {
    render(
      <Toggle
        label="Offline režim"
        checked
      />
    );

    expect(screen.getByRole('switch', { name: /offline režim/i })).toBeChecked();
  });

  it('shows the description', () => {
    render(
      <Toggle
        label="Offline režim"
        description="Stáhne poslední otevřené písně."
      />
    );

    expect(screen.getByText('Stáhne poslední otevřené písně.')).toBeInTheDocument();
  });

  it('reports the toggled value when clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        label="Automatické přehrávání"
        onCheckedChange={onCheckedChange}
      />
    );

    await user.click(screen.getByText('Automatické přehrávání'));

    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it('turns off when clicked while on', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        label="Automatické přehrávání"
        checked
        onCheckedChange={onCheckedChange}
      />
    );

    await user.click(screen.getByText('Automatické přehrávání'));

    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        label="Sdílení polohy"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole('switch', { name: /sdílení polohy/i })).toBeDisabled();
    await user.click(screen.getByText('Sdílení polohy'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
