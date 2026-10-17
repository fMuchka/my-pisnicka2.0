import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Textarea from '../Textarea.vue';

describe('Textarea', () => {
  it('links the label to the textarea', () => {
    render(Textarea, { props: { label: 'Poznámka', placeholder: 'Přidej poznámku…' } });

    const textarea = screen.getByRole('textbox', { name: 'Poznámka' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('placeholder', 'Přidej poznámku…');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  it('emits update:modelValue while typing', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Textarea, { props: { label: 'Poznámka' } });

    await user.type(screen.getByLabelText('Poznámka'), 'Kapo 2');

    expect(emitted('update:modelValue')?.at(-1)).toEqual(['Kapo 2']);
  });

  it('forwards extra attributes to the textarea', () => {
    render(Textarea, { props: { label: 'Poznámka' }, attrs: { name: 'note' } });

    expect(screen.getByLabelText('Poznámka')).toHaveAttribute('name', 'note');
  });

  it('shows a character counter and limits length when maxLength is set', () => {
    render(Textarea, { props: { label: 'Poznámka', modelValue: 'Hraje se v G', maxLength: 280 } });

    expect(screen.getByText('12 / 280')).toBeInTheDocument();
    expect(screen.getByLabelText('Poznámka')).toHaveAttribute('maxlength', '280');
  });

  it('has no counter without maxLength', () => {
    render(Textarea, { props: { label: 'Poznámka', modelValue: 'abc' } });

    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });

  it('shows the error text when invalid', async () => {
    render(Textarea, {
      props: { label: 'Důvod', invalid: true, errorText: 'Napiš prosím alespoň pár slov.' },
    });

    const textarea = screen.getByLabelText('Důvod');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() =>
      expect(textarea).toHaveAccessibleDescription('Napiš prosím alespoň pár slov.')
    );
  });

  it('describes the textarea with helper text', async () => {
    render(Textarea, { props: { label: 'Poznámka', helperText: 'Uvidíš ji jen ty' } });

    await waitFor(() =>
      expect(screen.getByLabelText('Poznámka')).toHaveAccessibleDescription('Uvidíš ji jen ty')
    );
  });

  it('disables the textarea', () => {
    render(Textarea, { props: { label: 'Poznámka', disabled: true } });

    expect(screen.getByLabelText('Poznámka')).toBeDisabled();
  });
});
