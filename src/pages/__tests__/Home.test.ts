import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import Home from '../Home.vue';
import Routes from '../../router/Routes';

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

  it('keeps info item non-navigating', async () => {
    const user = userEvent.setup();
    render(Home);

    const infoButton = screen.getByRole('button', { name: /informace/i });
    await user.click(infoButton);
    expect(router.push).not.toHaveBeenCalled();
  });
});
