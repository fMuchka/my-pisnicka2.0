import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import { Timestamp } from 'firebase/firestore';
import Home from '../Home.vue';
import type { Session } from '../../lib/session';
import type { Song } from '../../lib/song';
import Routes from '../../router/Routes';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const router = vi.hoisted(() => ({ push: vi.fn() }));
const mockSetSessionFromModel = vi.hoisted(() => vi.fn());

const mockUser = vi.hoisted(() => mockRef({ uid: 'host-123', displayName: 'Test Host' }));
const mockLatestSessions = vi.hoisted(() => mockRef<Session[]>([]));
const mockDisplaySongs = vi.hoisted(() => mockRef<Record<string, Song[]>>({}));
const mockSessionsError = vi.hoisted(() => mockRef<string | null>(null));
const mockSongsError = vi.hoisted(() => mockRef<string | null>(null));
const mockLoadingSection = vi.hoisted(() => mockRef<'sessions' | 'songs' | null>(null));

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

vi.mock('../../stores/session', () => ({
  useSessionStore: () => ({
    setSessionFromModel: mockSetSessionFromModel,
  }),
}));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockRef(true),
  }),
}));

vi.mock('../../composables/useHomeData', () => ({
  useHomeData: () => ({
    latestSessions: mockLatestSessions,
    sessionsError: mockSessionsError,
    songsError: mockSongsError,
    loadingSection: mockLoadingSection,
    displaySongs: mockDisplaySongs,
    fetchData: vi.fn(),
  }),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLatestSessions.value = [];
    mockDisplaySongs.value = {};
    mockSessionsError.value = null;
    mockSongsError.value = null;
    mockLoadingSection.value = null;
  });

  it('renders home view and key sections', () => {
    render(Home);

    expect(screen.getByTestId('home-view')).toBeInTheDocument();
    expect(screen.getByTestId('home-sessions-section')).toBeInTheDocument();
    expect(screen.getByTestId('home-songs-section')).toBeInTheDocument();
  });

  it('navigates to join, session list, and song library pages from section actions', async () => {
    const user = userEvent.setup();
    render(Home);

    await user.click(screen.getByLabelText('Připojit se k relaci'));
    expect(router.push).toHaveBeenCalledWith({ path: Routes.Join });

    await user.click(screen.getByRole('button', { name: 'Zobrazit všechny relace' }));
    expect(router.push).toHaveBeenCalledWith({ path: Routes.SessionList });

    await user.click(screen.getByLabelText('Zobrazit všechny písně'));
    expect(router.push).toHaveBeenCalledWith({ path: Routes.SongLibrary });
  });

  it('opens create session and create song dialogs from action buttons', async () => {
    render(Home);

    await fireEvent.click(screen.getByLabelText('Vytvořit novou relaci'));
    expect(screen.getByTestId('create-session-dialog')).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText('Vytvořit novou píseň'));
    expect(screen.getByTestId('create-song-dialog')).toBeInTheDocument();
  });

  it('opens a session, stores it, and routes with query params', async () => {
    const user = userEvent.setup();

    const session: Session = {
      id: 'session-1',
      name: 'Večerní jam',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
      isActive: true,
      pin: '4567',
      joinedBy: ['host-123'],
      createdAt: Timestamp.fromDate(new Date('2026-02-01T20:00:00')),
    };

    mockLatestSessions.value = [session];

    render(Home);

    await user.click(screen.getByText('Večerní jam'));

    expect(mockSetSessionFromModel).toHaveBeenCalledWith(session);
    expect(router.push).toHaveBeenCalledWith({
      path: '/session',
      query: {
        sessionId: 'session-1',
        hostId: 'host-123',
        pin: '4567',
      },
    });
  });

  it('routes to song detail when a song is clicked', async () => {
    const user = userEvent.setup();

    mockDisplaySongs.value = {
      Chinaski: [
        {
          ownerId: 'host-123',
          id: 'song-1',
          title: 'Klára',
          artist: 'Chinaski',
        },
      ],
    };

    render(Home);

    await user.click(screen.getByText('Klára'));

    expect(router.push).toHaveBeenCalledWith({ path: '/song/song-1' });
  });

  it('renders open and closed tags for sessions', () => {
    mockLatestSessions.value = [
      {
        id: 'session-open',
        name: 'Open Session',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
        isActive: true,
        pin: '1111',
        joinedBy: ['host-123'],
        createdAt: Timestamp.fromDate(new Date('2026-02-01T20:00:00')),
      },
      {
        id: 'session-closed',
        name: 'Closed Session',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
        isActive: false,
        pin: '2222',
        joinedBy: ['host-123'],
        createdAt: Timestamp.fromDate(new Date('2026-02-01T19:00:00')),
      },
    ];

    render(Home);

    expect(screen.getByText('Otevřená')).toBeInTheDocument();
    expect(screen.getByText('Uzavřená')).toBeInTheDocument();
  });
});
