import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPasswordLogin } from '../EmailPasswordLogin';
import { loginWithEmailPassword } from '../../../lib/authService';

vi.mock('../../../lib/authService', () => ({
  loginWithEmailPassword: vi.fn(),
}));

const login = vi.mocked(loginWithEmailPassword);

const fillAndSubmit = async (user: string, password: string) => {
  const userEvents = userEvent.setup();

  if (user) {
    await userEvents.type(screen.getByLabelText('Uživatel'), user);
  }
  if (password) {
    await userEvents.type(screen.getByLabelText('Heslo'), password);
  }
  await userEvents.click(screen.getByRole('button', { name: 'Přihlásit se' }));
};

describe('EmailPasswordLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user and password fields with a submit button', () => {
    render(<EmailPasswordLogin />);

    expect(screen.getByLabelText('Uživatel')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Heslo')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toHaveAttribute('type', 'submit');
  });

  it('shows format errors and skips login when the form is empty', async () => {
    render(<EmailPasswordLogin />);

    await fillAndSubmit('', '');

    expect(screen.getByLabelText('Uživatel')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Heslo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Nesprávný formát')).toBeInTheDocument();
    expect(screen.getByText('Heslo je prázdné')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects a malformed e-mail address', async () => {
    render(<EmailPasswordLogin />);

    await fillAndSubmit('tom@example', 'secret');

    expect(screen.getByLabelText('Uživatel')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Heslo')).not.toHaveAttribute('aria-invalid');
    expect(login).not.toHaveBeenCalled();
  });

  it('keeps the form enabled after a failed validation', async () => {
    render(<EmailPasswordLogin />);

    await fillAndSubmit('', '');

    expect(screen.getByLabelText('Uživatel')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeEnabled();
  });

  it('logs in with the trimmed user name and calls onLogin', async () => {
    login.mockResolvedValue({} as Awaited<ReturnType<typeof loginWithEmailPassword>>);
    const onLogin = vi.fn();
    render(<EmailPasswordLogin onLogin={onLogin} />);

    await fillAndSubmit('  tom  ', 'secret');

    expect(login).toHaveBeenCalledWith('tom', 'secret');
    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
  });

  it('marks both fields invalid when the credentials are rejected', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    login.mockRejectedValue(new Error('auth/invalid-credential'));
    const onLogin = vi.fn();
    render(<EmailPasswordLogin onLogin={onLogin} />);

    await fillAndSubmit('tom', 'wrong');

    await waitFor(() => expect(screen.getAllByText('Špatné údaje')).toHaveLength(2));
    expect(screen.getByLabelText('Uživatel')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Heslo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeEnabled();
    expect(onLogin).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('disables the form while the login request is pending', async () => {
    let resolveLogin: () => void = () => {};
    login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = () => resolve({} as Awaited<ReturnType<typeof loginWithEmailPassword>>);
        })
    );
    render(<EmailPasswordLogin />);

    await fillAndSubmit('tom', 'secret');

    expect(screen.getByLabelText('Uživatel')).toBeDisabled();
    expect(screen.getByLabelText('Heslo')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeDisabled();

    resolveLogin();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeEnabled());
  });
});
