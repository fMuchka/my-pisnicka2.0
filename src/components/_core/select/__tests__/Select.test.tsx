import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';
import type { SelectOption } from '../types';

const options: SelectOption[] = [
  { value: 'artist', label: 'Podle interpreta' },
  { value: 'title', label: 'Podle názvu' },
  { value: 'recent', label: 'Naposledy přidané', disabled: true },
];

describe('Select', () => {
  it('renders the labelled options', () => {
    render(
      <Select
        label="Řazení"
        options={options}
        value="artist"
      />
    );

    const select = screen.getByRole('combobox', { name: 'Řazení' });
    expect(select).toHaveValue('artist');
    expect(screen.getAllByRole('option').map((o) => o.textContent?.trim())).toEqual([
      'Podle interpreta',
      'Podle názvu',
      'Naposledy přidané',
    ]);
    expect(screen.getByRole('option', { name: 'Naposledy přidané' })).toBeDisabled();
  });

  it('reports the chosen value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        label="Řazení"
        options={options}
        value="artist"
        onValueChange={onValueChange}
      />
    );

    await user.selectOptions(screen.getByLabelText('Řazení'), 'title');

    expect(onValueChange).toHaveBeenLastCalledWith('title');
  });

  it('shows a disabled placeholder option while nothing is chosen', () => {
    render(
      <Select
        label="Kategorie"
        options={options}
        placeholder="Vyber kategorii"
      />
    );

    const placeholder = screen.getByRole('option', { name: 'Vyber kategorii' });
    expect(placeholder).toBeDisabled();
    expect(screen.getByLabelText('Kategorie')).toHaveValue('');
  });

  it('forwards extra attributes to the select', () => {
    render(
      <Select
        label="Řazení"
        options={options}
        name="sort"
      />
    );

    expect(screen.getByLabelText('Řazení')).toHaveAttribute('name', 'sort');
  });

  it('describes the select with helper text', async () => {
    render(
      <Select
        label="Jazyk"
        options={options}
        helperText="Zatím dostupné jen v češtině."
      />
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Jazyk')).toHaveAccessibleDescription(
        'Zatím dostupné jen v češtině.'
      )
    );
  });

  it('marks the select invalid and shows the error', async () => {
    render(
      <Select
        label="Kategorie"
        options={options}
        invalid
        errorText="Vyber kategorii"
      />
    );

    const select = screen.getByLabelText('Kategorie');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(select).toHaveAccessibleDescription('Vyber kategorii'));
  });

  it('disables the select', () => {
    render(
      <Select
        label="Jazyk"
        options={options}
        disabled
      />
    );

    expect(screen.getByLabelText('Jazyk')).toBeDisabled();
  });
});
