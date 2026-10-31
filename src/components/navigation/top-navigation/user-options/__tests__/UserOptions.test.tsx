import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { UserOptions } from '../UserOptions';
import Routes from '../../../../../router/Routes';

const auth = vi.hoisted(() => ({
  user: null as { email: string | null } | null,
  isAuthenticated: false,
  logout: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
  useAuth: () => ({ ...auth }),
}));

function LocationDisplay() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

const renderUserOptions = () =>
  render(
    <MemoryRouter initialEntries={[Routes.Info]}>
      <UserOptions />
      <LocationDisplay />
    </MemoryRouter>
  );

const trigger = () => screen.getByRole('button', { name: 'Uživatelské možnosti' });

describe('UserOptions', () => {
  beforeEach(() => {
    auth.user = null;
    auth.isAuthenticated = false;
    auth.logout.mockClear();
  });

  it('labels the trigger with the email name for signed-in users', () => {
    auth.user = { email: ' jana.novak@example.com ' };
    auth.isAuthenticated = true;
    renderUserOptions();

    expect(trigger()).toHaveTextContent('jana.novak');
    expect(trigger()).toHaveClass('user-trigger');
  });

  it('falls back to the placeholder name without an email', () => {
    renderUserOptions();

    expect(trigger()).toHaveTextContent('Melon');
  });

  it('sends signed-out users to Login instead of opening a menu', async () => {
    const user = userEvent.setup();
    renderUserOptions();

    await user.click(trigger());

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(Routes.Login);
  });

  it('opens a styled menu with the logout item for signed-in users', async () => {
    const user = userEvent.setup();
    auth.user = { email: 'jana@example.com' };
    auth.isAuthenticated = true;
    renderUserOptions();

    await user.click(trigger());

    expect(await screen.findByRole('menu')).toHaveClass('user-options-menu');
    expect(screen.getByRole('menuitem', { name: 'Odhlásit se' })).toHaveClass('user-menu-button');
  });

  it('logs out and goes to Login when the logout item is selected', async () => {
    const user = userEvent.setup();
    auth.user = { email: 'jana@example.com' };
    auth.isAuthenticated = true;
    renderUserOptions();

    await user.click(trigger());
    await user.click(await screen.findByRole('menuitem', { name: 'Odhlásit se' }));

    expect(auth.logout).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(Routes.Login));
  });
});
