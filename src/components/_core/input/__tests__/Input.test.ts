import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Search } from 'lucide-vue-next';
import Input from '../Input.vue';

describe('Input', () => {
  it('links the label to the input', () => {
    render(Input, { props: { label: 'Uživatel', placeholder: 'Tom Bombadil' } });

    const input = screen.getByLabelText('Uživatel');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Tom Bombadil');
  });

  it('emits update:modelValue while typing', async () => {
    const user = userEvent.setup();
    const { emitted } = render(Input, { props: { label: 'Uživatel' } });

    await user.type(screen.getByLabelText('Uživatel'), 'Tom');

    expect(emitted('update:modelValue')?.at(-1)).toEqual(['Tom']);
  });

  it('shows the current modelValue', () => {
    render(Input, { props: { label: 'Uživatel', modelValue: 'Tom Bombadil' } });

    expect(screen.getByLabelText('Uživatel')).toHaveValue('Tom Bombadil');
  });

  it('forwards extra attributes to the input element', () => {
    render(Input, {
      props: { label: 'E-mail', type: 'email' },
      attrs: { name: 'email', autocomplete: 'email' },
    });

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('describes the input with helper text', async () => {
    render(Input, { props: { label: 'Název', helperText: 'Alespoň 1 znak' } });

    // Ark links helper and error text via aria-describedby only after mount.
    await waitFor(() =>
      expect(screen.getByLabelText('Název')).toHaveAccessibleDescription('Alespoň 1 znak')
    );
  });

  it('shows the error text only when invalid', async () => {
    const { rerender } = render(Input, {
      props: { label: 'E-mail', errorText: 'Neplatný e-mail', helperText: 'Pracovní e-mail' },
    });

    expect(screen.queryByText('Neplatný e-mail')).not.toBeInTheDocument();
    expect(screen.getByText('Pracovní e-mail')).toBeInTheDocument();

    await rerender({
      label: 'E-mail',
      errorText: 'Neplatný e-mail',
      helperText: 'Pracovní e-mail',
      invalid: true,
    });

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(input).toHaveAccessibleDescription('Neplatný e-mail'));
    expect(screen.queryByText('Pracovní e-mail')).not.toBeInTheDocument();
  });

  it('replaces helper text with success text in the success state', () => {
    render(Input, {
      props: {
        label: 'Uživatel',
        helperText: 'Vyber si jméno',
        success: true,
        successText: 'Jméno je volné',
      },
    });

    expect(screen.getByText('Jméno je volné')).toBeInTheDocument();
    expect(screen.queryByText('Vyber si jméno')).not.toBeInTheDocument();
  });

  it('ignores success when the input is also invalid', () => {
    render(Input, {
      props: { label: 'Uživatel', success: true, successText: 'Jméno je volné', invalid: true },
    });

    expect(screen.queryByText('Jméno je volné')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Uživatel')).not.toHaveClass('field-input--success');
  });

  it('disables the input', () => {
    render(Input, { props: { label: 'Uživatel', disabled: true } });

    expect(screen.getByLabelText('Uživatel')).toBeDisabled();
  });

  it('marks required fields', () => {
    render(Input, { props: { label: 'Název', required: true } });

    expect(screen.getByRole('textbox', { name: /název/i })).toBeRequired();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(Input, { props: { label: 'Heslo', type: 'password', modelValue: 'tajne' } });

    const input = screen.getByLabelText('Heslo');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Zobrazit heslo' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Skrýt heslo' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not render a visibility toggle for non-password inputs', () => {
    render(Input, { props: { label: 'Uživatel' } });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a prepend icon and works without a visible label', () => {
    const { container } = render(Input, {
      props: { type: 'search', prependIcon: Search },
      attrs: { 'aria-label': 'Hledat' },
    });

    expect(screen.getByRole('searchbox', { name: 'Hledat' })).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
