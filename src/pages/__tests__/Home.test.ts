import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import Home from '../Home.vue';
import Routes from '../../router/Routes';
import { getLatestTimelineTime } from '../../lib/timeline/timeline';

const TIMELINE_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: router.push }),
}));

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: defineComponent({
    name: 'TopNavigation',
    setup() {
      return () => h('div', { 'data-testid': 'top-navigation' });
    },
  }),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders home view and nav items', () => {
    render(Home);

    expect(screen.getByTestId('home-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /písně/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /relace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /informace/i })).toBeInTheDocument();
  });

  it('navigates to songs and session list pages from nav items', async () => {
    const user = userEvent.setup();
    render(Home);

    await user.click(screen.getByRole('button', { name: /písně/i }));
    expect(router.push).toHaveBeenCalledWith({ path: Routes.SongLibrary });

    await user.click(screen.getByRole('button', { name: /relace/i }));
    expect(router.push).toHaveBeenCalledWith({ path: Routes.SessionList });
  });

  it('navigates to info page from info nav item', async () => {
    const user = userEvent.setup();
    render(Home);

    const infoButton = screen.getByRole('button', { name: /informace/i });
    await user.click(infoButton);
    expect(router.push).toHaveBeenCalledWith({ path: Routes.Info });
    expect(localStorage.getItem(TIMELINE_VISITED_STORAGE_KEY)).toBe(getLatestTimelineTime());
  });

  it('shows info badge when timeline has unseen changes', async () => {
    localStorage.removeItem(TIMELINE_VISITED_STORAGE_KEY);
    render(Home);

    expect(await screen.findByText(/nové/i)).toBeInTheDocument();
  });

  it('hides info badge when latest timeline item is already visited', () => {
    const latestTimelineTime = getLatestTimelineTime();

    if (latestTimelineTime == null) {
      throw new Error('Expected timeline data to contain at least one event');
    }

    localStorage.setItem(TIMELINE_VISITED_STORAGE_KEY, latestTimelineTime);
    render(Home);

    expect(screen.queryByText(/nové/i)).not.toBeInTheDocument();
  });
});
