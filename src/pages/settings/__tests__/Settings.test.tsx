import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Settings from '../Settings';
import Routes from '../../../router/Routes';
import { useTheme } from '../../../hooks/useTheme';
import { usePageNavigationState } from '../../../hooks/usePageNavigation';
import { useSessionStore } from '../../../stores/session';

const mocks = vi.hoisted(() => ({
  isGuest: false,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ isGuest: mocks.isGuest }),
}));

// The session store rechecks restored sessions against Firestore on import.
vi.mock('../../../lib/session', () => ({ getSessionStatus: vi.fn() }));

const renderSettings = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );

const setActiveSession = () =>
  useSessionStore
    .getState()
    .setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.isGuest = false;
    useSessionStore.getState().clearSession();
    useTheme.getState().setTheme('dark');
    useTheme.getState().setColorPreset('red');
  });

  it('sets the page title', () => {
    renderSettings();

    expect(usePageNavigationState.getState().pageTitle).toBe('Nastavení');
  });

  it('marks the current theme and color preset as pressed', () => {
    renderSettings();

    expect(screen.getByRole('button', { name: /tmavý/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /světlý/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Klasika' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Les' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the theme', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: /světlý/i }));

    expect(useTheme.getState().theme).toBe('light');
    expect(screen.getByRole('button', { name: /světlý/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /tmavý/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the color preset', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Les' }));

    expect(useTheme.getState().colorPreset).toBe('green');
    expect(screen.getByRole('button', { name: 'Les' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Klasika' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('previews a song sheet with its sections and chords', () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Náhled' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sloka' })).toHaveClass('section-label');
    expect(screen.getByRole('heading', { name: 'Refrén' })).toBeInTheDocument();
    expect(screen.getAllByText('G')[0]).toHaveClass('chord');
  });

  it('switches between the visual and the feature settings', async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.getByRole('radio', { name: 'Vzhled' })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'Motiv' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Režim hraní' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Funkce' }));

    expect(screen.getByRole('heading', { name: 'Režim hraní' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /nezhasínat obrazovku/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Motiv' })).not.toBeInTheDocument();
  });

  it('links guests back to their active session', () => {
    mocks.isGuest = true;
    setActiveSession();
    renderSettings();

    expect(screen.getByRole('link', { name: /zpět do relace/i })).toHaveAttribute(
      'href',
      `${Routes.Session}?sessionId=s1&hostId=h1&pin=1234`
    );
  });

  it('hides the session link for guests without an active session', () => {
    mocks.isGuest = true;
    renderSettings();

    expect(screen.queryByRole('link', { name: /zpět do relace/i })).not.toBeInTheDocument();
  });

  it('hides the session link for signed-in users', () => {
    setActiveSession();
    renderSettings();

    expect(screen.queryByRole('link', { name: /zpět do relace/i })).not.toBeInTheDocument();
  });
});
