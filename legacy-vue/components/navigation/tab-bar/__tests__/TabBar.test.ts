import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createMemoryHistory, createRouter } from 'vue-router';
import { HomeIcon, List, Music, User, Users } from 'lucide-vue-next';
import TabBar, { type TabBarPage } from '../TabBar.vue';

const home: TabBarPage = { icon: { component: HomeIcon }, label: 'Domů', link: '/', id: 'home' };
const playlists: TabBarPage = {
  icon: { component: List },
  label: 'Playlisty',
  link: '/playlists',
  id: 'playlist',
};
const sessions: TabBarPage = {
  icon: { component: Users },
  label: 'Relace',
  link: '/sessionList',
  id: 'session',
};
const account: TabBarPage = {
  icon: { component: User },
  label: 'Účet',
  link: '/account',
  id: 'user',
};
const mainPage: TabBarPage = {
  icon: { component: Music },
  label: 'Písně',
  link: '/songs',
  id: 'music',
};

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });

const renderTabBar = (props: Partial<InstanceType<typeof TabBar>['$props']> = {}) => {
  const router = createTestRouter();
  const result = render(TabBar, {
    props: {
      pages: [home, playlists, sessions, account],
      mainPage,
      currentPageId: 'home',
      ...props,
    },
    global: { plugins: [router] },
  });
  return { ...result, router };
};

const linkLabels = () => screen.getAllByRole('link').map((link) => link.textContent?.trim());

describe('TabBar', () => {
  it('renders the main page in the middle with the pages split around it', () => {
    renderTabBar();

    expect(linkLabels()).toEqual(['Domů', 'Playlisty', 'Písně', 'Relace', 'Účet']);
  });

  it('puts the extra page on the left when the page count is odd', () => {
    renderTabBar({ pages: [home, playlists, sessions] });

    expect(linkLabels()).toEqual(['Domů', 'Playlisty', 'Písně', 'Relace']);
  });

  it('links each tab to its page', () => {
    renderTabBar();

    expect(screen.getByRole('link', { name: 'Domů' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Písně' })).toHaveAttribute('href', '/songs');
    expect(screen.getByRole('link', { name: 'Účet' })).toHaveAttribute('href', '/account');
  });

  it('marks only the current page with aria-current', () => {
    renderTabBar({ currentPageId: 'session' });

    expect(screen.getByRole('link', { name: 'Relace' })).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))
    ).toHaveLength(1);
  });

  it('marks the main page as current when on it', () => {
    renderTabBar({ currentPageId: 'music' });

    expect(screen.getByRole('link', { name: 'Písně' })).toHaveAttribute('aria-current', 'page');
  });

  it('updates the tabs when the pages prop changes', async () => {
    const { rerender } = renderTabBar();

    await rerender({ pages: [home, account] });

    expect(linkLabels()).toEqual(['Domů', 'Písně', 'Účet']);
  });

  it('navigates to the page when a tab is clicked', async () => {
    const user = userEvent.setup();
    const { router } = renderTabBar();

    await user.click(screen.getByRole('link', { name: 'Relace' }));

    expect(router.currentRoute.value.path).toBe('/sessionList');
  });
});
