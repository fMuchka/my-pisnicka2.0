import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SongPage from '../Song.vue';
import type { Song } from '../../lib/song';
import Routes from '../../router/Routes';

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
  replace: vi.fn(),
  back: vi.fn(),
}));

const routeState = vi.hoisted(() => ({
  path: '/song/song-1',
  params: { songId: 'song-1' as string | string[] | undefined },
}));

const authState = vi.hoisted(() => ({
  isAuthenticated: mockRef(true) as MutableRef<boolean>,
  user: mockRef({ uid: 'host-123', displayName: 'Test Host' }) as MutableRef<{
    uid: string;
    displayName: string;
  } | null>,
}));

const songState = vi.hoisted(() => ({
  song: mockRef(null) as MutableRef<Song | null>,
  songError: mockRef(null) as MutableRef<string | null>,
  songLoading: mockRef(false) as MutableRef<boolean>,
}));

const storeMocks = vi.hoisted(() => ({
  createSong: vi.fn(),
  updateSong: vi.fn(),
}));

const songLibMocks = vi.hoisted(() => ({
  createSongCatalogEntry: vi.fn(),
  updateSongCatalogEntry: vi.fn(),
  fetchSongCatalogEntryBySourceSongId: vi.fn(),
  fetchAllSongCategories: vi.fn(),
  resolveSongCategoryIds: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => router,
}));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
  }),
}));

vi.mock('../../composables/useSongDetail', () => ({
  useSongDetail: () => songState,
}));

vi.mock('../../stores/song', () => ({
  useSongStore: () => ({
    createSong: storeMocks.createSong,
    updateSong: storeMocks.updateSong,
  }),
}));

vi.mock('../../lib/song', () => ({
  createSongCatalogEntry: songLibMocks.createSongCatalogEntry,
  updateSongCatalogEntry: songLibMocks.updateSongCatalogEntry,
  fetchSongCatalogEntryBySourceSongId: songLibMocks.fetchSongCatalogEntryBySourceSongId,
  fetchAllSongCategories: songLibMocks.fetchAllSongCategories,
  resolveSongCategoryIds: songLibMocks.resolveSongCategoryIds,
}));

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: {
    props: ['pageTitle', 'pageSubtitle', 'showBack', 'backToPath', 'fadeAway'],
    template: '<header role="banner"><h1>{{ pageTitle }}</h1><p>{{ pageSubtitle }}</p></header>',
  },
}));

vi.mock('../../stores/session', () => ({
  useSessionStore: () => ({
    sessionDetails: null,
  }),
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
    props: ['chords', 'transpose'],
    template:
      '<div data-testid="song-chord-overview">{{ chords.join(\',\') }}|{{ transpose }}</div>',
  },
}));

vi.mock('../../components/song/SongQuickInfo.vue', () => ({
  default: {
    props: ['capo', 'originalKey', 'transpose'],
    template:
      '<div data-testid="song-quick-info">{{ capo }}|{{ originalKey }}|{{ transpose }}</div>',
  },
}));

vi.mock('../../components/song/ChordLayoutRenderer.vue', () => ({
  default: {
    props: ['text'],
    template: '<pre data-testid="song-layout">{{ text }}</pre>',
  },
}));

vi.mock('../../components/song/SongTextEditor.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'mode', 'showToolbar'],
    emits: ['update:modelValue', 'unique-chords'],
    template:
      "<textarea data-testid=\"song-text-editor\" :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value); $emit('unique-chords', ['Am', 'C'])\" />",
  },
}));

vi.mock('../../components/dialogs/song-chords/SongChordsDialog.vue', () => ({
  default: {
    props: ['open', 'chords', 'transpose'],
    emits: ['update:open', 'update:transpose'],
    template: '<div data-testid="song-chords-dialog" />',
  },
}));

vi.mock('../../components/song/SongControls.vue', () => ({
  default: {
    props: ['mode', 'editorMode', 'confirmDisabled'],
    emits: [
      'toggle-play',
      'step-back',
      'step-forward',
      'open-chords',
      'select-source',
      'select-preview',
      'cancel',
      'confirm',
    ],
    template:
      '<div data-testid="song-controls" :data-mode="mode" :data-editor-mode="editorMode"><button @click="$emit(\'select-source\')">Zdroj</button><button @click="$emit(\'select-preview\')">Náhled</button><button @click="$emit(\'cancel\')">Zrušit</button><button :disabled="confirmDisabled" @click="$emit(\'confirm\')">Potvrdit</button></div>',
  },
}));

describe('Song Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.path = '/song/song-1';
    routeState.params.songId = 'song-1';
    authState.isAuthenticated.value = true;
    authState.user.value = { uid: 'host-123', displayName: 'Test Host' };
    songState.song.value = null;
    songState.songError.value = null;
    songState.songLoading.value = false;
    songLibMocks.fetchSongCatalogEntryBySourceSongId.mockResolvedValue(null);
    songLibMocks.fetchAllSongCategories.mockResolvedValue([]);
    songLibMocks.resolveSongCategoryIds.mockResolvedValue([]);
    songLibMocks.createSongCatalogEntry.mockResolvedValue({ id: 'catalog-1' });
    songLibMocks.updateSongCatalogEntry.mockResolvedValue({ id: 'catalog-1' });
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

  it('renders sections from markers and quick info', () => {
    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
      chords: ['G', 'D', 'Am', ''],
      originalKey: 'G',
      capo: 2,
      text: '[intro]\n[G] Intro line\n[verse]\n[D] Verse line',
      ownerId: '',
    };

    render(SongPage);

    expect(screen.getByText('Song title')).toBeInTheDocument();
    expect(screen.getByText('Artist name')).toBeInTheDocument();
    expect(screen.getByText('Úvod')).toBeInTheDocument();
    expect(screen.getByText('Sloka')).toBeInTheDocument();
    expect(screen.getByTestId('song-quick-info')).toHaveTextContent('2|G|0');
  });

  it('opens inline edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();

    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
      text: 'Lyrics',
      ownerId: '',
    };
    authState.isAuthenticated.value = true;

    render(SongPage);

    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));

    await waitFor(() => {
      expect(songLibMocks.fetchSongCatalogEntryBySourceSongId).toHaveBeenCalledWith('song-1');
    });

    expect(screen.getByPlaceholderText("Např. Knockin' on Heaven's Door")).toHaveValue(
      'Song title'
    );
    expect(screen.queryByTestId('song-quick-info')).not.toBeInTheDocument();
    expect(screen.getByTestId('song-controls')).toHaveAttribute('data-mode', 'edit');
  });

  it('shows edit button only for authenticated users', () => {
    songState.song.value = {
      id: 'song-1',
      title: 'Song title',
      artist: 'Artist name',
      ownerId: '',
    };

    authState.isAuthenticated.value = false;
    const { unmount } = render(SongPage);

    expect(screen.queryByRole('button', { name: 'Upravit píseň' })).not.toBeInTheDocument();

    unmount();

    authState.isAuthenticated.value = true;
    render(SongPage);

    expect(screen.getByRole('button', { name: 'Upravit píseň' })).toBeInTheDocument();
  });

  it('renders create mode as inline editor and disables confirm for empty required fields', () => {
    routeState.path = Routes.SongCreate;
    routeState.params.songId = undefined;

    render(SongPage);

    expect(screen.getByPlaceholderText("Např. Knockin' on Heaven's Door")).toBeInTheDocument();
    expect(screen.getByTestId('song-controls')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByRole('button', { name: 'Potvrdit' })).toBeDisabled();
  });

  it('creates a song from create mode and navigates to the saved detail page', async () => {
    const user = userEvent.setup();
    routeState.path = Routes.SongCreate;
    routeState.params.songId = undefined;

    const createdSong: Song = {
      id: 'song-2',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      text: 'line',
      chords: ['Am', 'C'],
      ownerId: 'host-123',
    };

    storeMocks.createSong.mockResolvedValue(createdSong);

    render(SongPage);

    await user.type(
      screen.getByPlaceholderText("Např. Knockin' on Heaven's Door"),
      "Knockin on Heaven's Door"
    );
    await user.type(screen.getByPlaceholderText('Např. Bob Dylan'), 'Bob Dylan');
    await user.type(screen.getByTestId('song-text-editor'), 'line');
    await user.click(screen.getByRole('button', { name: 'Potvrdit' }));

    await waitFor(() => {
      expect(storeMocks.createSong).toHaveBeenCalledWith({
        title: "Knockin on Heaven's Door",
        artist: 'Bob Dylan',
        text: 'line',
        chords: ['Am', 'C'],
        ownerId: 'host-123',
      });

      expect(songLibMocks.createSongCatalogEntry).toHaveBeenCalledWith({
        title: "Knockin on Heaven's Door",
        artist: 'Bob Dylan',
        chords: ['Am', 'C'],
        categories: [],
        sourceSongId: 'song-2',
        ownerId: 'host-123',
      });

      expect(router.replace).toHaveBeenCalledWith({ path: '/song/song-2' });
    });
  });

  it('updates an existing song from inline edit mode', async () => {
    const user = userEvent.setup();

    songState.song.value = {
      id: 'song-9',
      title: 'Old title',
      artist: 'Old artist',
      text: 'old',
      chords: ['C'],
      ownerId: 'host-123',
    };

    storeMocks.updateSong.mockResolvedValue({
      id: 'song-9',
      title: 'New title',
      artist: 'New artist',
      text: 'new',
      chords: ['Am', 'C'],
      ownerId: 'host-123',
    });
    songLibMocks.fetchSongCatalogEntryBySourceSongId.mockResolvedValue({
      id: 'catalog-9',
      sourceSongId: 'song-9',
      title: 'Old title',
      artist: 'Old artist',
      ownerId: 'host-123',
    });

    render(SongPage);
    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));

    await waitFor(() => {
      expect(songLibMocks.fetchSongCatalogEntryBySourceSongId).toHaveBeenCalledWith('song-9');
    });

    const titleInput = screen.getByPlaceholderText("Např. Knockin' on Heaven's Door");
    const artistInput = screen.getByPlaceholderText('Např. Bob Dylan');
    await fireEvent.update(titleInput, 'New title');
    await fireEvent.update(artistInput, 'New artist');
    await user.click(screen.getByRole('button', { name: 'Zdroj' }));
    await fireEvent.update(screen.getByTestId('song-text-editor'), 'new');
    await user.click(screen.getByRole('button', { name: 'Potvrdit' }));

    await waitFor(() => {
      expect(storeMocks.updateSong).toHaveBeenCalledWith('song-9', {
        title: 'New title',
        artist: 'New artist',
        text: 'new',
        chords: ['Am', 'C'],
        ownerId: 'host-123',
      });

      expect(songLibMocks.updateSongCatalogEntry).toHaveBeenCalledWith('catalog-9', {
        title: 'New title',
        artist: 'New artist',
        chords: ['Am', 'C'],
        categories: [],
        sourceSongId: 'song-9',
        ownerId: 'host-123',
      });
    });
  });
});
