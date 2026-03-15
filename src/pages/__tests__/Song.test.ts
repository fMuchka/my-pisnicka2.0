import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SongPage from '../Song.vue';
import type { Song } from '../../lib/song';

type MutableRef<T> = { value: T };
type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const router = vi.hoisted(() => ({
  push: vi.fn(),
}));

const routeState = vi.hoisted(() => ({
  params: { songId: 'song-1' as string | string[] | undefined },
}));

const authState = vi.hoisted(() => ({
  isAuthenticated: mockRef(true) as MutableRef<boolean>,
}));

const songState = vi.hoisted(() => ({
  song: mockRef(null) as MutableRef<Song | null>,
  songError: mockRef(null) as MutableRef<string | null>,
  songLoading: mockRef(false) as MutableRef<boolean>,
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => router,
}));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
  }),
}));

vi.mock('../../composables/useSongDetail', () => ({
  useSongDetail: () => songState,
}));

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: { template: '<header role="banner" />' },
}));

vi.mock('../../components/PageHeader.vue', () => ({
  default: {
    props: ['title', 'tagline'],
    template: '<div><h1>{{ title }}</h1><p>{{ tagline }}</p></div>',
  },
}));

vi.mock('../../components/core/LoadingSpinner.vue', () => ({
  default: {
    props: ['label'],
    template: '<div>{{ label }}</div>',
  },
}));

vi.mock('../../components/core/ErrorMessage.vue', () => ({
  default: {
    props: ['message'],
    template: '<div>{{ message }}</div>',
  },
}));

vi.mock('../../components/song/SongChordOverview.vue', () => ({
  default: {
    props: ['chords'],
    template: '<div data-testid="song-chord-overview">{{ chords.join(\',\') }}</div>',
  },
}));

vi.mock('../../components/song/ChordLayoutRenderer.vue', () => ({
  default: {
    props: ['text'],
    template: '<pre data-testid="song-layout">{{ text }}</pre>',
  },
}));

vi.mock('../../components/dialogs/create-song/CreateSongDialog.vue', () => ({
  default: {
    props: ['open', 'songToEdit'],
    emits: ['update:open', 'saved'],
    template: '<div data-testid="create-song-dialog" :data-open="open ? \'yes\' : \'no\'" />',
  },
}));

describe('Song Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.params.songId = 'song-1';
    authState.isAuthenticated.value = true;
    songState.song.value = null;
    songState.songError.value = null;
    songState.songLoading.value = false;
  });

  it('shows loading state when song is loading', () => {
    songState.songLoading.value = true;

    render(SongPage);

    expect(screen.getByText('Načítání písně...')).toBeInTheDocument();
  });

  it('shows error state when song loading fails', () => {
    songState.songError.value = 'Chyba při načítání písně. network fail';

    render(SongPage);

    expect(screen.getByText('Chyba při načítání písně. network fail')).toBeInTheDocument();
  });

  it('shows empty state when song is not found', () => {
    render(SongPage);

    expect(screen.getByText('Píseň nebyla nalezena')).toBeInTheDocument();
  });

  it('renders sections from markers and chord overview', () => {
    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
      chords: ['G', 'D', 'Am', ''],
      text: '[intro]\n[G] Intro line\n[verse]\n[D] Verse line',
    };

    render(SongPage);

    expect(screen.getByText('Song title')).toBeInTheDocument();
    expect(screen.getByText('Artist name')).toBeInTheDocument();
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Verse')).toBeInTheDocument();
    expect(screen.getByTestId('song-chord-overview')).toHaveTextContent('G,D,Am');
  });

  it('navigates back to home when back button is clicked', async () => {
    const user = userEvent.setup();

    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
      text: 'Lyrics',
    };

    render(SongPage);

    await user.click(screen.getByRole('button', { name: 'Zpět na přehled' }));

    expect(router.push).toHaveBeenCalledWith({ path: '/' });
  });

  it('shows edit button only for authenticated users', () => {
    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
    };

    authState.isAuthenticated.value = false;
    const { unmount } = render(SongPage);

    expect(screen.queryByRole('button', { name: 'Upravit píseň' })).not.toBeInTheDocument();

    unmount();

    authState.isAuthenticated.value = true;
    render(SongPage);

    expect(screen.getByRole('button', { name: 'Upravit píseň' })).toBeInTheDocument();
  });
});
