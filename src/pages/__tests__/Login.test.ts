import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { loginWithEmailPassword } from '../../lib/authService';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: router.push }),
}));

vi.mock('../../lib/authService', () => ({ loginWithEmailPassword: vi.fn() }));

const mockedLogin = loginWithEmailPassword as Mock;

// Import the component under test (to be implemented by developer)
import Login from '../Login.vue';

describe('Login Page', () => {
  it('renders user and password input fields', () => {
    render(Login);
    expect(screen.getByLabelText(/uživatel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders host and guest buttons', () => {
    render(Login);
    expect(screen.getByRole('button', { name: /přihlásit se/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pokračovat bez účtu/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(user, 'not-an-email@');
    await userEvent.type(password, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    expect(screen.getByLabelText(/Nesprávný formát/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    await userEvent.type(user, 'admin');
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    expect(screen.getByLabelText(/heslo je prázdné/i)).toBeInTheDocument();
  });

  it('calls loginWithEmailPassword with username when host login form submitted', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(user, 'admin');
    await userEvent.type(password, 'secret123');
    mockedLogin.mockResolvedValue({ user: { uid: 'u1', email: 'admin@mypisnicka.com' } });
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    expect(loginWithEmailPassword).toHaveBeenCalledWith('admin', 'secret123');
  });

  it('calls loginWithEmailPassword with full email when provided', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(user, 'admin@mypisnicka.com');
    await userEvent.type(password, 'secret123');
    mockedLogin.mockResolvedValue({ user: { uid: 'u1', email: 'admin@mypisnicka.com' } });
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    expect(loginWithEmailPassword).toHaveBeenCalledWith('admin@mypisnicka.com', 'secret123');
  });

  it('shows error message when login fails', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(user, 'admin');
    await userEvent.type(password, 'badpassw');
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    const errors = await screen.findAllByLabelText(/špatné údaje/i);
    expect(errors).toHaveLength(2);
  });

  it('redirects to / on successful host login', async () => {
    render(Login);
    const user = screen.getByLabelText(/uživatel/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(user, 'admin');
    await userEvent.type(password, 'secret123');
    mockedLogin.mockResolvedValue({ user: { uid: 'u1', email: 'admin@mypisnicka.com' } });
    await userEvent.click(screen.getByRole('button', { name: /přihlásit se/i }));
    expect(router.push).toHaveBeenCalledWith('/');
  });
});
