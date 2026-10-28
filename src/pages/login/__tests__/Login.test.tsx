import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import Routes from '../../../router/Routes';
import { loginWithEmailPassword } from '../../../lib/authService';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../../lib/authService', () => ({
  loginWithEmailPassword: vi.fn(),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wordmark, login form and join button', () => {
    render(<Login />);

    expect(screen.getByText('Písnička')).toBeInTheDocument();
    expect(screen.getByLabelText('Uživatel')).toBeInTheDocument();
    expect(screen.getByLabelText('Heslo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Připojit se bez účtu' })).toBeInTheDocument();
  });

  it('navigates to the join page without logging in', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Připojit se bez účtu' }));

    expect(mocks.navigate).toHaveBeenCalledWith(Routes.Join);
    expect(loginWithEmailPassword).not.toHaveBeenCalled();
  });

  it('navigates home after a successful login', async () => {
    vi.mocked(loginWithEmailPassword).mockResolvedValue(
      {} as Awaited<ReturnType<typeof loginWithEmailPassword>>
    );
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Uživatel'), 'tom');
    await user.type(screen.getByLabelText('Heslo'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(Routes.Home));
  });

  it('stays on the page when the login fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(loginWithEmailPassword).mockRejectedValue(new Error('auth/invalid-credential'));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Uživatel'), 'tom');
    await user.type(screen.getByLabelText('Heslo'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Přihlásit se' }));

    await waitFor(() => expect(screen.getAllByText('Špatné údaje')).toHaveLength(2));
    expect(mocks.navigate).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
