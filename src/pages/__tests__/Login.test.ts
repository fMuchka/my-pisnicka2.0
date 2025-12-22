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
  it('renders email and password input fields', () => {
    render(Login);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders "Login as Host" and "Continue as Guest" buttons', () => {
    render(Login);
    expect(screen.getByRole('button', { name: /login as host/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    render(Login);
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(email, 'not-an-email');
    await userEvent.type(password, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login as host/i }));
    expect(screen.getByLabelText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    render(Login);
    const email = screen.getByLabelText(/email/i);
    await userEvent.type(email, 'host@host.com');
    await userEvent.click(screen.getByRole('button', { name: /login as host/i }));
    expect(screen.getByLabelText(/password is required/i)).toBeInTheDocument();
  });

  it('calls loginWithEmailPassword when host login form submitted', async () => {
    render(Login);
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(email, 'host@host.com');
    await userEvent.type(password, 'secret123');
    mockedLogin.mockResolvedValue({ user: { uid: 'u1', email: 'host@host.com' } });
    await userEvent.click(screen.getByRole('button', { name: /login as host/i }));
    expect(loginWithEmailPassword).toHaveBeenCalledWith('host@host.com', 'secret123');
  });

  it('shows error message when login fails', async () => {
    render(Login);
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(email, 'host@host.com');
    await userEvent.type(password, 'badpassw');
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));
    await userEvent.click(screen.getByRole('button', { name: /login as host/i }));
    const errors = await screen.findAllByLabelText(/invalid credentials/i);
    expect(errors).toHaveLength(2);
  });

  it('redirects to /library on successful host login', async () => {
    render(Login);
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.type(email, 'host@host.com');
    await userEvent.type(password, 'secret123');
    mockedLogin.mockResolvedValue({ user: { uid: 'u1', email: 'host@host.com' } });
    await userEvent.click(screen.getByRole('button', { name: /login as host/i }));
    expect(router.push).toHaveBeenCalledWith('/library');
  });
});
