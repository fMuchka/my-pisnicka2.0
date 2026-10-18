import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadioGroup from '../RadioGroup';
import type { RadioOption } from '../types';

const options: RadioOption[] = [
  { value: 'dark', label: 'Tmavý motiv' },
  { value: 'light', label: 'Světlý motiv' },
  { value: 'system', label: 'Podle systému', disabled: true },
];

describe('RadioGroup', () => {
  it('renders a labelled radio per option with the current value checked', () => {
    render(
      <RadioGroup
        label="Motiv"
        options={options}
        value="dark"
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Motiv' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tmavý motiv' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Světlý motiv' })).not.toBeChecked();
  });

  it('reports the clicked option value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        options={options}
        value="dark"
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByText('Světlý motiv'));

    expect(onValueChange).toHaveBeenLastCalledWith('light');
  });

  it('does not select a disabled option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        options={options}
        value="dark"
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByRole('radio', { name: 'Podle systému' })).toBeDisabled();
    await user.click(screen.getByText('Podle systému'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables every option when the group is disabled', () => {
    render(
      <RadioGroup
        options={options}
        disabled
      />
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });

  it('gives every radio the group name', () => {
    render(
      <RadioGroup
        options={options}
        name="theme"
      />
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('name', 'theme');
    }
  });
});
