import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Select from '../Select.vue';
import type { SelectOption } from '../types';

const options: SelectOption[] = [
  { value: 'artist', label: 'Podle interpreta' },
  { value: 'title', label: 'Podle názvu' },
  { value: 'recent', label: 'Naposledy přidané', disabled: true },
];

describe('Select', () => {
  it('renders the labelled options', () => {
    render(Select, { props: { label: 'Řazení', options, modelValue: 'artist' } });

    const select = screen.getByRole('combobox', { name: 'Řazení' });
    expect(select).toHaveValue('artist');
    expect(screen.getAllByRole('option').map((o) => o.textContent?.trim())).toEqual([
      'Podle interpreta',
      'Podle názvu',
      'Naposledy přidané',
    ]);
    expect(screen.getByRole('option', { name: 'Naposledy přidané' })).toBeDisabled();
  });

  it('emits the chosen value', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Select, {
      props: { label: 'Řazení', options, modelValue: 'artist' },
    });

    await user.selectOptions(screen.getByLabelText('Řazení'), 'title');

    expect(emitted('update:modelValue')?.at(-1)).toEqual(['title']);
  });

  it('shows a disabled placeholder option while nothing is chosen', () => {
    render(Select, { props: { label: 'Kategorie', options, placeholder: 'Vyber kategorii' } });

    const placeholder = screen.getByRole('option', { name: 'Vyber kategorii' });
    expect(placeholder).toBeDisabled();
    expect(screen.getByLabelText('Kategorie')).toHaveValue('');
  });

  it('forwards extra attributes to the select', () => {
    render(Select, { props: { label: 'Řazení', options }, attrs: { name: 'sort' } });

    expect(screen.getByLabelText('Řazení')).toHaveAttribute('name', 'sort');
  });

  it('describes the select with helper text', async () => {
    render(Select, {
      props: { label: 'Jazyk', options, helperText: 'Zatím dostupné jen v češtině.' },
    });

    await waitFor(() =>
      expect(screen.getByLabelText('Jazyk')).toHaveAccessibleDescription(
        'Zatím dostupné jen v češtině.'
      )
    );
  });

  it('marks the select invalid and shows the error', async () => {
    render(Select, {
      props: { label: 'Kategorie', options, invalid: true, errorText: 'Vyber kategorii' },
    });

    const select = screen.getByLabelText('Kategorie');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(select).toHaveAccessibleDescription('Vyber kategorii'));
  });

  it('disables the select', () => {
    render(Select, { props: { label: 'Jazyk', options, disabled: true } });

    expect(screen.getByLabelText('Jazyk')).toBeDisabled();
  });
});
