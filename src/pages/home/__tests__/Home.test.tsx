import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../Home';
import Routes from '../../../router/Routes';
import { getLatestTimelineTime } from '../../../lib/timeline/timeline';

const TIMELINE_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  user: { email: 'tom@example.com' } as { email: string | null } | null,
}));

vi.mock('react-router', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

const markTimelineVisited = () => {
  const latestTimelineTime = getLatestTimelineTime();

  if (latestTimelineTime == null) {
    throw new Error('Expected timeline data to contain at least one event');
  }

  localStorage.setItem(TIMELINE_VISITED_STORAGE_KEY, latestTimelineTime);
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.user = { email: 'tom@example.com' };
  });

  it('renders home view and nav items', () => {
    render(<Home />);

    expect(screen.getByTestId('home-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /písně/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /relace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /informace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nastavení/i })).toBeInTheDocument();
  });

  it('navigates to songs, session list and settings pages from nav items', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: /písně/i }));
    expect(mocks.navigate).toHaveBeenCalledWith(Routes.SongLibrary);

    await user.click(screen.getByRole('button', { name: /relace/i }));
    expect(mocks.navigate).toHaveBeenCalledWith(Routes.SessionList);

    await user.click(screen.getByRole('button', { name: /nastavení/i }));
    expect(mocks.navigate).toHaveBeenCalledWith(Routes.Settings);
  });

  it('greets the user by the email name', () => {
    render(<Home />);

    expect(screen.getByText(/vítej zpět/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'tom' })).toBeInTheDocument();
  });

  it('greets with a placeholder name when the user has no email', () => {
    mocks.user = { email: null };
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: 'Melon' })).toBeInTheDocument();
  });

  it('navigates to info page without marking the timeline as visited', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: /informace/i }));

    expect(mocks.navigate).toHaveBeenCalledWith(Routes.Info);
    expect(localStorage.getItem(TIMELINE_VISITED_STORAGE_KEY)).toBeNull();
  });

  it('shows info badge when timeline has unseen changes', () => {
    render(<Home />);

    expect(screen.getByText(/nové/i)).toBeInTheDocument();
  });

  it('hides info badge once the info tile is opened', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: /informace/i }));

    expect(screen.queryByText(/nové/i)).not.toBeInTheDocument();
  });

  it('hides info badge when latest timeline item is already visited', () => {
    markTimelineVisited();
    render(<Home />);

    expect(screen.queryByText(/nové/i)).not.toBeInTheDocument();
  });
});
