import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import Navigation from '../Navigation.vue';
import { usePageNavigation, type PageNavigation } from '../../../composables/usePageNavigation';
import Routes from '../../../router/Routes';

const view = vi.hoisted(() => ({ isMobile: false }));
const auth = vi.hoisted(() => ({ isAuthenticated: true, isGuest: false }));
const session = vi.hoisted(() => ({
  hasActiveSession: false,
  activeSessionRoute: null as { path: string; query: Record<string, string> } | null,
}));

vi.mock('../../../composables/useDeviceViewType', () => ({
  useDeviceViewType: () => ({ isMobile: ref(view.isMobile), isDesktop: ref(!view.isMobile) }),
}));

vi.mock('../../../composables/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: ref(auth.isAuthenticated), isGuest: ref(auth.isGuest) }),
}));

vi.mock('../../../stores/session', () => ({
  useSessionStore: () => ({ ...session }),
}));

vi.mock('../top-navigation/options/UserOptions.vue', () => ({
  default: defineComponent({ setup: () => () => h('div', { 'data-testid': 'user-options' }) }),
}));

const renderNavigation = async (path: string, page: PageNavigation = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });
  await router.push(path);
  await router.isReady();

  const Page = defineComponent({
    setup() {
      usePageNavigation(page);
      return () => h(Navigation);
    },
  });
  render(Page, { global: { plugins: [router] } });

  return { router };
};

describe('Navigation', () => {
  beforeEach(() => {
    view.isMobile = false;
    auth.isAuthenticated = true;
    auth.isGuest = false;
    session.hasActiveSession = false;
    session.activeSessionRoute = null;
  });

  it('renders the full top navigation on desktop', async () => {
    await renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByText('Informace')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nastavení', hidden: true })).not.toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));

    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Nastavení' })).toBeVisible());
    expect(screen.getByTestId('user-options')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Info' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the settings page from the desktop menu settings button', async () => {
    const { router } = await renderNavigation(Routes.Home);

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Nastavení' }));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(Routes.Settings));
  });

  it('shows a settings tab on mobile', async () => {
    view.isMobile = true;
    await renderNavigation(Routes.Settings);

    expect(screen.getByRole('link', { name: 'Nastavení' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows options but no page links in the desktop menu for guests', async () => {
    auth.isGuest = true;
    await renderNavigation(Routes.Session);

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));

    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Nastavení' })).toBeVisible());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sends unauthenticated users to Login when the logo is clicked', async () => {
    auth.isAuthenticated = false;
    const { router } = await renderNavigation(Routes.Join);

    await userEvent.click(screen.getByText('MyPísnička'));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(Routes.Login));
  });

  it('sends PIN guests back to their session when the logo is clicked', async () => {
    auth.isAuthenticated = false;
    auth.isGuest = true;
    session.hasActiveSession = true;
    session.activeSessionRoute = {
      path: Routes.Session,
      query: { sessionId: 's1', hostId: 'h1', pin: '1234' },
    };
    const { router } = await renderNavigation(Routes.Settings);

    await userEvent.click(screen.getByText('MyPísnička'));

    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/session?sessionId=s1&hostId=h1&pin=1234')
    );
  });

  it('sends hosts Home when the logo is clicked', async () => {
    const { router } = await renderNavigation(Routes.Info);

    await userEvent.click(screen.getByText('MyPísnička'));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(Routes.Home));
  });

  it('renders logo row and tab bar on mobile, without title or options', async () => {
    view.isMobile = true;
    await renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText('Informace')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Info' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the songs tab active on a song detail page', async () => {
    view.isMobile = true;
    await renderNavigation('/song/abc');

    expect(screen.getByRole('link', { name: 'Písně' })).toHaveAttribute('aria-current', 'page');
  });

  it('hides the tab bar for guests on mobile', async () => {
    view.isMobile = true;
    auth.isGuest = true;
    await renderNavigation(Routes.Session);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('MyPísnička')).toBeInTheDocument();
  });

  it('gives PIN guests a settings button on mobile', async () => {
    view.isMobile = true;
    auth.isAuthenticated = false;
    auth.isGuest = true;
    session.hasActiveSession = true;
    const { router } = await renderNavigation(Routes.Session);

    await userEvent.click(screen.getByRole('button', { name: 'Nastavení' }));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(Routes.Settings));
  });

  it('hides the settings button from guests without a session', async () => {
    auth.isAuthenticated = false;
    auth.isGuest = true;

    view.isMobile = true;
    await renderNavigation(Routes.Session);
    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
  });

  it('hides the desktop settings button from guests without a session', async () => {
    auth.isAuthenticated = false;
    auth.isGuest = true;
    await renderNavigation(Routes.Session);

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));

    await vi.waitFor(() => expect(screen.getByTestId('user-options')).toBeVisible());
    expect(screen.queryByRole('button', { name: 'Nastavení' })).not.toBeInTheDocument();
  });
});
