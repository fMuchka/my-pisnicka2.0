import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';
import Input from '../Input';

describe('Input', () => {
  it('links the label to the input', () => {
    render(
      <Input
        label="Uživatel"
        placeholder="Tom Bombadil"
      />
    );

    const input = screen.getByLabelText('Uživatel');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Tom Bombadil');
  });

  it('reports the value while typing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Input
        label="Uživatel"
        onValueChange={onValueChange}
      />
    );

    await user.type(screen.getByLabelText('Uživatel'), 'Tom');

    expect(onValueChange).toHaveBeenLastCalledWith('Tom');
  });

  it('shows the current value', () => {
    render(
      <Input
        label="Uživatel"
        value="Tom Bombadil"
      />
    );

    expect(screen.getByLabelText('Uživatel')).toHaveValue('Tom Bombadil');
  });

  it('forwards extra attributes to the input element', () => {
    render(
      <Input
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
      />
    );

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('describes the input with helper text', async () => {
    render(
      <Input
        label="Název"
        helperText="Alespoň 1 znak"
      />
    );

    // Ark links helper and error text via aria-describedby only after mount.
    await waitFor(() =>
      expect(screen.getByLabelText('Název')).toHaveAccessibleDescription('Alespoň 1 znak')
    );
  });

  it('shows the error text only when invalid', async () => {
    const { rerender } = render(
      <Input
        label="E-mail"
        errorText="Neplatný e-mail"
        helperText="Pracovní e-mail"
      />
    );

    expect(screen.queryByText('Neplatný e-mail')).not.toBeInTheDocument();
    expect(screen.getByText('Pracovní e-mail')).toBeInTheDocument();

    rerender(
      <Input
        label="E-mail"
        errorText="Neplatný e-mail"
        helperText="Pracovní e-mail"
        invalid
      />
    );

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(input).toHaveAccessibleDescription('Neplatný e-mail'));
    expect(screen.queryByText('Pracovní e-mail')).not.toBeInTheDocument();
  });

  it('replaces helper text with success text in the success state', () => {
    render(
      <Input
        label="Uživatel"
        helperText="Vyber si jméno"
        success
        successText="Jméno je volné"
      />
    );

    expect(screen.getByText('Jméno je volné')).toBeInTheDocument();
    expect(screen.queryByText('Vyber si jméno')).not.toBeInTheDocument();
  });

  it('ignores success when the input is also invalid', () => {
    render(
      <Input
        label="Uživatel"
        success
        successText="Jméno je volné"
        invalid
      />
    );

    expect(screen.queryByText('Jméno je volné')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Uživatel')).not.toHaveClass('field-input--success');
  });

  it('disables the input', () => {
    render(
      <Input
        label="Uživatel"
        disabled
      />
    );

    expect(screen.getByLabelText('Uživatel')).toBeDisabled();
  });

  it('marks required fields', () => {
    render(
      <Input
        label="Název"
        required
      />
    );

    expect(screen.getByRole('textbox', { name: /název/i })).toBeRequired();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <Input
        label="Heslo"
        type="password"
        defaultValue="tajne"
      />
    );

    const input = screen.getByLabelText('Heslo');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Zobrazit heslo' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Skrýt heslo' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not render a visibility toggle for non-password inputs', () => {
    render(<Input label="Uživatel" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a prepend icon and works without a visible label', () => {
    const { container } = render(
      <Input
        type="search"
        prependIcon={Search}
        aria-label="Hledat"
      />
    );

    expect(screen.getByRole('searchbox', { name: 'Hledat' })).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
