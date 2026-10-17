import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Toggle from '../Toggle.vue';

describe('Toggle', () => {
  it('renders a labelled switch reflecting modelValue', () => {
    render(Toggle, { props: { label: 'Offline režim', modelValue: true } });

    expect(screen.getByRole('switch', { name: /offline režim/i })).toBeChecked();
  });

  it('shows the description', () => {
    render(Toggle, {
      props: { label: 'Offline režim', description: 'Stáhne poslední otevřené písně.' },
    });

    expect(screen.getByText('Stáhne poslední otevřené písně.')).toBeInTheDocument();
  });

  it('emits the toggled value when clicked', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Toggle, { props: { label: 'Automatické přehrávání' } });

    await user.click(screen.getByText('Automatické přehrávání'));

    expect(emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  it('turns off when clicked while on', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Toggle, {
      props: { label: 'Automatické přehrávání', modelValue: true },
    });

    await user.click(screen.getByText('Automatické přehrávání'));

    expect(emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Toggle, {
      props: { label: 'Sdílení polohy', disabled: true },
    });

    expect(screen.getByRole('switch', { name: /sdílení polohy/i })).toBeDisabled();
    await user.click(screen.getByText('Sdílení polohy'));

    expect(emitted('update:modelValue')).toBeUndefined();
  });
});
