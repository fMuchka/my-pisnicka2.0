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

vi.mock('../../../composables/useDeviceViewType', () => ({
  useDeviceViewType: () => ({ isMobile: ref(view.isMobile), isDesktop: ref(!view.isMobile) }),
}));

vi.mock('../../../composables/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: ref(auth.isAuthenticated), isGuest: ref(auth.isGuest) }),
}));

// The real TopNavigation imports /mypisnicka-icon.svg from public/, which Vitest can't resolve on Windows.
vi.mock('../top-navigation/TopNavigation.vue', () => ({
  default: defineComponent({
    props: { pageTitle: { type: String, default: undefined }, fadeAway: Boolean },
    emits: ['home'],
    setup(props, { emit, slots }) {
      return () =>
        h('header', [
          h('button', { onClick: () => emit('home') }, 'MyPísnička'),
          props.pageTitle ? h('h1', props.pageTitle) : null,
          slots.actions?.(),
        ]);
    },
  }),
}));

vi.mock('../top-navigation/options/AppOptions.vue', () => ({
  default: defineComponent({ setup: () => () => h('div', { 'data-testid': 'app-options' }) }),
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
  });

  it('renders the full top navigation on desktop', async () => {
    await renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByText('Informace')).toBeInTheDocument();
    expect(screen.getByTestId('app-options')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('sends unauthenticated users to Login when the logo is clicked', async () => {
    auth.isAuthenticated = false;
    const { router } = await renderNavigation(Routes.Join);

    await userEvent.click(screen.getByText('MyPísnička'));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(Routes.Login));
  });

  it('renders logo row and tab bar on mobile, without title or options', async () => {
    view.isMobile = true;
    await renderNavigation(Routes.Info, { pageTitle: 'Informace' });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText('Informace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-options')).not.toBeInTheDocument();
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
});
