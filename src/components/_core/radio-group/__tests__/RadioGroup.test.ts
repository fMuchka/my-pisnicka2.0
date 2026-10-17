import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RadioGroup from '../RadioGroup.vue';
import type { RadioOption } from '../types';

const options: RadioOption[] = [
  { value: 'dark', label: 'Tmavý motiv' },
  { value: 'light', label: 'Světlý motiv' },
  { value: 'system', label: 'Podle systému', disabled: true },
];

describe('RadioGroup', () => {
  it('renders a labelled radio per option with the current value checked', () => {
    render(RadioGroup, { props: { label: 'Motiv', options, modelValue: 'dark' } });

    expect(screen.getByRole('radiogroup', { name: 'Motiv' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tmavý motiv' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Světlý motiv' })).not.toBeChecked();
  });

  it('emits the clicked option value', async () => {
    const user = userEvent.setup();
    const { emitted } = render(RadioGroup, { props: { options, modelValue: 'dark' } });

    await user.click(screen.getByText('Světlý motiv'));

    expect(emitted('update:modelValue')?.at(-1)).toEqual(['light']);
  });

  it('does not select a disabled option', async () => {
    const user = userEvent.setup();
    const { emitted } = render(RadioGroup, { props: { options, modelValue: 'dark' } });

    expect(screen.getByRole('radio', { name: 'Podle systému' })).toBeDisabled();
    await user.click(screen.getByText('Podle systému'));

    expect(emitted('update:modelValue')).toBeUndefined();
  });

  it('disables every option when the group is disabled', () => {
    render(RadioGroup, { props: { options, disabled: true } });

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });

  it('gives every radio the group name', () => {
    render(RadioGroup, { props: { options, name: 'theme' } });

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('name', 'theme');
    }
  });
});
