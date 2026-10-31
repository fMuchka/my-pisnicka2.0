import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { Navigation } from '../Navigation';
import { usePageNavigationState, type PageNavigation } from '../../../hooks/usePageNavigation';
import { useSessionStore } from '../../../stores/session';
import Routes from '../../../router/Routes';

const view = vi.hoisted(() => ({ isMobile: false }));
const auth = vi.hoisted(() => ({ isAuthenticated: true, isGuest: false }));

vi.mock('../../../hooks/useDeviceViewType', () => ({
  useDeviceViewType: () => ({ isMobile: view.isMobile, isDesktop: !view.isMobile }),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ ...auth }),
}));

vi.mock('../top-navigation/user-options/UserOptions', () => ({
  UserOptions: () => <div data-testid="user-options" />,
}));

function LocationDisplay() {
  const { pathname, search } = useLocation();
  return <span data-testid="location">{pathname + search}</span>;
}

const renderNavigation = (path: string, page: PageNavigation = {}) => {
  usePageNavigationState.setState(page, true);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navigation />
      <LocationDisplay />
    </MemoryRouter>
  );
};

const location = () => screen.getByTestId('location');
const logo = () => screen.getByRole('button', { name: 'MyPísnička' });

const joinSession = () =>
  useSessionStore
    .getState()
    .setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });

describe('Navigation', () => {
  beforeEach(() => {
    view.isMobile = false;
    auth.isAuthenticated = true;
    auth.isGuest = false;
    useSessionStore.getState().clearSession();
    document.body.style.paddingBottom = '';
  });

  it('renders the full top navigation on desktop', async () => {
    const user = userEvent.setup();
    renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByRole('heading', { name: 'Informace' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-options')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Otevřít menu' }));

    expect(await screen.findByRole('link', { name: 'Info' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('opens the settings page from the desktop menu settings link', async () => {
    const user = userEvent.setup();
    renderNavigation(Routes.Home);

    await user.click(screen.getByRole('button', { name: 'Otevřít menu' }));
    await user.click(await screen.findByRole('link', { name: 'Nastavení' }));

    expect(location()).toHaveTextContent(Routes.Settings);
  });

  it('shows a settings tab on mobile', () => {
    view.isMobile = true;
    renderNavigation(Routes.Settings);

    expect(screen.getByRole('link', { name: 'Nastavení' })).toHaveAttribute('aria-current', 'page');
  });

  it('gives desktop guests with a session a settings button instead of the menu', async () => {
    const user = userEvent.setup();
    auth.isGuest = true;
    joinSession();
    renderNavigation(Routes.Session);

    expect(screen.queryByRole('button', { name: 'Otevřít menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nastavení' }));

    expect(location()).toHaveTextContent(Routes.Settings);
  });

  it('sends unauthenticated users to Login when the logo is clicked', async () => {
    const user = userEvent.setup();
    auth.isAuthenticated = false;
    auth.isGuest = true;
    renderNavigation(Routes.Join);

    await user.click(logo());

    expect(location()).toHaveTextContent(Routes.Login);
  });

  it('sends PIN guests back to their session when the logo is clicked', async () => {
    const user = userEvent.setup();
    auth.isAuthenticated = false;
    auth.isGuest = true;
    joinSession();
    renderNavigation(Routes.Settings);

    await user.click(logo());

    expect(location()).toHaveTextContent('/session?sessionId=s1&hostId=h1&pin=1234');
  });

  it('sends hosts Home when the logo is clicked', async () => {
    const user = userEvent.setup();
    renderNavigation(Routes.Info);

    await user.click(logo());

    expect(location()).toHaveTextContent(/^\/$/);
  });

  it('renders logo row, user options and app bar on mobile, without title or menu', () => {
    view.isMobile = true;
    renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('user-options')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Informace' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Otevřít menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Info' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the songs tab active on a song detail page', () => {
    view.isMobile = true;
    renderNavigation('/song/abc');

    expect(screen.getByRole('link', { name: 'Písně' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the sessions tab active on a session page', () => {
    view.isMobile = true;
    renderNavigation(Routes.Session);

    expect(screen.getByRole('link', { name: 'Relace' })).toHaveAttribute('aria-current', 'page');
  });

  it('hides the app bar for guests on mobile', () => {
    view.isMobile = true;
    auth.isGuest = true;
    renderNavigation(Routes.Session);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(logo()).toBeInTheDocument();
  });

  it('gives PIN guests a settings button on mobile', async () => {
    const user = userEvent.setup();
    view.isMobile = true;
    auth.isAuthenticated = false;
    auth.isGuest = true;
    joinSession();
    renderNavigation(Routes.Session);

    await user.click(screen.getByRole('button', { name: 'Nastavení' }));

    expect(location()).toHaveTextContent(Routes.Settings);
  });

  it('hides the settings button from mobile guests without a session', () => {
    view.isMobile = true;
    auth.isAuthenticated = false;
    auth.isGuest = true;
    renderNavigation(Routes.Session);

    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
  });

  it('hides the desktop settings button and menu from guests without a session', () => {
    auth.isAuthenticated = false;
    auth.isGuest = true;
    renderNavigation(Routes.Session);

    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Otevřít menu' })).not.toBeInTheDocument();
  });

  it('docks the app bar and reserves its height on the body only on mobile', () => {
    view.isMobile = true;
    const { container, unmount } = renderNavigation(Routes.Home);

    const dock = container.querySelector('.app-bar-dock');
    expect(dock).toContainElement(screen.getByRole('navigation'));
    expect(document.body.style.paddingBottom).toMatch(/^\d+px$/);

    unmount();
    expect(document.body.style.paddingBottom).toBe('');
  });

  it('leaves the body padding alone on desktop', () => {
    renderNavigation(Routes.Home);

    expect(document.body.style.paddingBottom).toBe('');
  });

  it('follows the page title set through the page navigation store', async () => {
    renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    usePageNavigationState.setState({ pageTitle: 'Nastavení' }, true);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Nastavení' })).toBeInTheDocument()
    );
  });
});
