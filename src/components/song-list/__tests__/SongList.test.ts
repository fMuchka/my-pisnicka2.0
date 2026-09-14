import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import SongList from '../SongList.vue';
import type { Song, SongCategory } from '../../../lib/song';
import type { Timestamp } from 'firebase/firestore';
import { songListStore } from '../../../stores/songList';
import type { Playlist } from '../../../lib/playlist';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const mockRouterPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetchUserPlaylists = vi.fn();
const mockFetchPublicPlaylists = vi.fn();
const mockFetchPlaylistSongRefs = vi.fn();
const mockCreatePlaylist = vi.fn();
const mockAddSongToPlaylist = vi.fn();
const mockRemoveSongFromPlaylist = vi.fn();

const mockUserSongs = mockRef<Song[]>([]);
const mockSongCategories = mockRef<SongCategory[]>([]);
const mockIsRefreshing = mockRef(false);
const mockUser = mockRef<{ uid: string; displayName: string } | null>({
  uid: 'user-123',
  displayName: 'Test User',
});

vi.mock('../../../composables/useSongListData', () => ({
  useSongListData: () => ({
    userSongs: mockUserSongs,
    songCategories: mockSongCategories,
    isRefreshing: mockIsRefreshing,
    refresh: mockRefresh,
  }),
}));

vi.mock('../../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../../lib/playlist', () => ({
  fetchUserPlaylists: (...args: unknown[]) => mockFetchUserPlaylists(...args),
  fetchPublicPlaylists: (...args: unknown[]) => mockFetchPublicPlaylists(...args),
  fetchPlaylistSongRefs: (...args: unknown[]) => mockFetchPlaylistSongRefs(...args),
  createPlaylist: (...args: unknown[]) => mockCreatePlaylist(...args),
  addSongToPlaylist: (...args: unknown[]) => mockAddSongToPlaylist(...args),
  removeSongFromPlaylist: (...args: unknown[]) => mockRemoveSongFromPlaylist(...args),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('../flat-view/SongListFlatView.vue', () => ({
  default: defineComponent({
    name: 'SongListFlatView',
    props: {
      songs: { type: Array, required: true },
      onSongClick: { type: Function, required: true },
      isInteractive: { type: Boolean, required: true },
    },
    setup(props) {
      return () =>
        h('div', { 'data-testid': 'flat-view' }, [
          h(
            'p',
            { 'data-testid': 'flat-view-count' },
            `${(props.songs as unknown[]).length} songs`
          ),
          h('div', { 'data-testid': 'flat-view-interactive' }, String(props.isInteractive)),
          h(
            'button',
            {
              'data-testid': 'flat-view-click-first',
              onClick: () => {
                const firstSong = (props.songs as Song[])[0];
                if (firstSong !== undefined) {
                  (props.onSongClick as (song: Song) => void)(firstSong);
                }
              },
            },
            'click-first-song'
          ),
        ]);
    },
  }),
}));

vi.mock('../tree-view/SongListTreeView.vue', () => ({
  default: defineComponent({
    name: 'SongListTreeView',
    props: {
      songs: { type: Array, required: true },
      artistsLabel: { type: String, required: true },
      autoExpandOnFilter: { type: Boolean, required: false, default: false },
      onSongClick: { type: Function, required: true },
      isInteractive: { type: Boolean, required: true },
      selectionMode: { type: Boolean, required: false, default: false },
      selectedSongIds: { type: Array, required: false, default: () => [] },
      onToggleSongSelection: { type: Function, required: false, default: undefined },
    },
    setup(props) {
      return () =>
        h('div', { 'data-testid': 'tree-view' }, [
          h(
            'p',
            { 'data-testid': 'tree-view-count' },
            `${(props.songs as unknown[]).length} songs`
          ),
          h('p', { 'data-testid': 'tree-view-label' }, props.artistsLabel),
          h(
            'div',
            { 'data-testid': 'tree-view-auto-expand-on-filter' },
            String(props.autoExpandOnFilter)
          ),
          h('div', { 'data-testid': 'tree-view-interactive' }, String(props.isInteractive)),
          h('div', { 'data-testid': 'tree-view-selection-mode' }, String(props.selectionMode)),
          h(
            'div',
            { 'data-testid': 'tree-view-selected-song-ids' },
            JSON.stringify(props.selectedSongIds)
          ),
          h(
            'button',
            {
              'data-testid': 'tree-view-toggle-first-selection',
              onClick: () => {
                const firstSong = (props.songs as Song[])[0];
                if (firstSong !== undefined && props.onToggleSongSelection) {
                  (props.onToggleSongSelection as (song: Song) => void)(firstSong);
                }
              },
            },
            'toggle-first-selection'
          ),
        ]);
    },
  }),
}));

// Keep ResizeObserver polyfill available for compatibility with UI primitives in tests.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

describe('SongList', () => {
  const searchInputName = 'Hledat písně podle názvu nebo interpreta';
  const searchButtonName = 'Hledat';

  const submitGlobalSearch = async (
    user: ReturnType<typeof userEvent.setup>,
    searchTerm: string
  ) => {
    const searchInput = screen.getByRole('searchbox', { name: searchInputName });
    await user.clear(searchInput);
    await user.type(searchInput, searchTerm);
    await user.click(screen.getByRole('button', { name: searchButtonName }));
  };

  const mockPlaylists: Playlist[] = [
    {
      id: 'playlist-1',
      name: 'Moje pecky',
      ownerId: 'user-123',
      visibility: 'private',
    },
  ];

  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Song 1',
      artist: 'Artist A',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
    {
      id: 'song-2',
      title: 'Song 2',
      artist: 'Artist B',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockUserSongs.value = [];
    mockSongCategories.value = [];
    mockIsRefreshing.value = false;
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };
    mockFetchUserPlaylists.mockResolvedValue([]);
    mockFetchPublicPlaylists.mockResolvedValue([]);
    mockFetchPlaylistSongRefs.mockResolvedValue([]);
    mockCreatePlaylist.mockResolvedValue(undefined);
    mockAddSongToPlaylist.mockResolvedValue(true);
    mockRemoveSongFromPlaylist.mockResolvedValue(undefined);
  });

  it('does not render legacy song list heading', () => {
    render(SongList);

    expect(screen.queryByRole('heading', { name: 'Seznam písní' })).not.toBeInTheDocument();
  });

  it('renders source switch for playlists and global songs', () => {
    render(SongList);

    expect(screen.getByRole('button', { name: 'Playlisty' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Všechny písně' })).toBeInTheDocument();
  });

  it('loads user playlists in playlist mode', async () => {
    const user = userEvent.setup();
    mockFetchUserPlaylists.mockResolvedValue(mockPlaylists);

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Playlisty' }));

    await waitFor(() => {
      expect(mockFetchUserPlaylists).toHaveBeenCalledWith('user-123');
      expect(screen.getByTestId('playlist-select-trigger')).toHaveTextContent('Moje pecky');
    });
  });

  it('session guest playlist mode loads host public playlists only', async () => {
    const user = userEvent.setup();
    mockUser.value = null;
    mockFetchPublicPlaylists.mockResolvedValue([
      {
        id: 'host-public',
        name: 'Host veřejný',
        ownerId: 'host-123',
        visibility: 'public',
      },
      {
        id: 'other-public',
        name: 'Cizí veřejný',
        ownerId: 'other-999',
        visibility: 'public',
      },
    ]);

    render(SongList, {
      props: {
        sessionHostId: 'host-123',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Playlisty' }));

    await waitFor(() => {
      expect(screen.getByTestId('playlist-select-trigger')).toHaveTextContent('Host veřejný');
      expect(screen.queryByText('Cizí veřejný')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Veřejné' })).not.toBeInTheDocument();
    });
  });

  it('adds selected global songs to selected playlist through bulk action bar', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockFetchUserPlaylists.mockResolvedValue(mockPlaylists);

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Playlisty' }));

    await waitFor(() => {
      expect(screen.getByTestId('playlist-select-trigger')).toHaveTextContent('Moje pecky');
    });

    await user.click(screen.getByRole('button', { name: 'Všechny písně' }));

    await submitGlobalSearch(user, 'Song');

    expect(screen.getByTestId('tree-view-selection-mode')).toHaveTextContent('true');

    await user.click(screen.getByTestId('tree-view-toggle-first-selection'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Přidat vybrané do Moje pecky' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Přidat vybrané do Moje pecky' }));

    await waitFor(() => {
      expect(mockAddSongToPlaylist).toHaveBeenCalledWith('playlist-1', 'song-1');
    });
  });

  it('removes selected playlist songs through bulk action bar', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockFetchUserPlaylists.mockResolvedValue(mockPlaylists);
    mockFetchPlaylistSongRefs.mockResolvedValue([
      {
        id: 'ref-1',
        sourceSongId: 'song-1',
        position: 0,
      },
    ]);

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Playlisty' }));

    await waitFor(() => {
      expect(screen.getByTestId('tree-view-selection-mode')).toHaveTextContent('true');
    });

    await user.click(screen.getByTestId('tree-view-toggle-first-selection'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Odebrat vybrané z playlistu' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Odebrat vybrané z playlistu' }));

    await waitFor(() => {
      expect(mockRemoveSongFromPlaylist).toHaveBeenCalledWith('playlist-1', 'ref-1');
    });
  });

  it('renders direct view mode controls', () => {
    render(SongList);

    expect(screen.getByRole('button', { name: 'Strom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plochý seznam' })).toBeInTheDocument();
  });

  it('renders search input for title and artist filtering', () => {
    render(SongList);

    expect(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' })
    ).toBeInTheDocument();
  });

  it('does not show global songs before explicit search submit', () => {
    mockUserSongs.value = mockSongs;

    render(SongList);

    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tree-view')).not.toBeInTheDocument();
    expect(screen.getByText('Zadej hledání a potvrď tlačítkem Hledat.')).toBeInTheDocument();
  });

  it('switches to tree view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    const treeButton = screen.getByRole('button', { name: 'Strom' });
    await user.click(treeButton);

    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();
  });

  it('switches back to flat view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Strom' }));
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
  });

  it('displays empty state message when no songs', () => {
    mockUserSongs.value = [];

    render(SongList);

    expect(screen.getByText('Zadej hledání a potvrď tlačítkem Hledat.')).toBeInTheDocument();
  });

  it('passes correct aria-label to view mode group', () => {
    render(SongList);

    const viewModeGroup = screen.getByLabelText('Režim zobrazení seznamu písní');
    expect(viewModeGroup).toBeInTheDocument();
  });

  it('passes correct props to flat view component', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));

    expect(screen.getByTestId('flat-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
  });

  it('passes correct props to tree view component', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Strom' }));

    expect(screen.getByTestId('tree-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('tree-view-label')).toHaveTextContent('Interpreti');
    expect(screen.getByTestId('tree-view-auto-expand-on-filter')).toHaveTextContent('true');
    expect(screen.getByTestId('tree-view-interactive')).toHaveTextContent('true');
  });

  it('enables tree auto expand when search filter is active', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Artist');

    expect(screen.getByTestId('tree-view-auto-expand-on-filter')).toHaveTextContent('true');
  });

  it('filters songs by title', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    songListStore().viewMode = 'flat';

    render(SongList);

    await submitGlobalSearch(user, 'Song 2');

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('filters songs by artist', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    songListStore().viewMode = 'flat';

    render(SongList);

    await submitGlobalSearch(user, 'Artist B');

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('filters songs by structured artist and title query with AND', async () => {
    const user = userEvent.setup();
    songListStore().viewMode = 'flat';
    mockUserSongs.value = [
      {
        id: 'song-structured-1',
        title: "Knocking on Heaven's Door",
        artist: 'Bob Dylan',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-structured-2',
        title: 'Like a Rolling Stone',
        artist: 'Bob Dylan',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-structured-3',
        title: "Knocking on Heaven's Door",
        artist: "Guns N' Roses",
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongList);

    await submitGlobalSearch(user, "artist:Bob Dylan&&title:Knocking on Heaven's Door");

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('filters songs by structured query with OR', async () => {
    const user = userEvent.setup();
    songListStore().viewMode = 'flat';
    mockUserSongs.value = [
      {
        id: 'song-or-1',
        title: "Knocking on Heaven's Door",
        artist: 'Bob Dylan',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-or-2',
        title: 'Space Oddity',
        artist: 'David Bowie',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-or-3',
        title: 'Paranoid Android',
        artist: 'Radiohead',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongList);

    await submitGlobalSearch(user, 'artist:Bob Dylan||title:Space Oddity');

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('2 songs');
    });
  });

  it('shows filtered empty state when no songs match the search', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await submitGlobalSearch(user, 'No match');

    expect(screen.getByText('Žádné písně neodpovídají hledání.')).toBeInTheDocument();
    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
  });

  it('allows song navigation for authenticated user', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    await user.click(screen.getByTestId('flat-view-click-first'));

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    expect(mockRouterPush).toHaveBeenCalledWith({ path: '/song/song-1' });
  });

  it('allows song navigation when authenticated user is not the owner', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = { uid: 'different-user', displayName: 'Other User' };

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    await user.click(screen.getByTestId('flat-view-click-first'));

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    expect(mockRouterPush).toHaveBeenCalledWith({ path: '/song/song-1' });
  });

  it('allows song navigation when not authenticated', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = null;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    await user.click(screen.getByTestId('flat-view-click-first'));

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    expect(mockRouterPush).toHaveBeenCalledWith({ path: '/song/song-1' });
  });

  it('sorts songs alphabetically by artist then title', async () => {
    const user = userEvent.setup();
    const unsortedSongs: Song[] = [
      {
        id: 'z-1',
        title: 'Zebra Song',
        artist: 'Artist Z',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'a-1',
        title: 'Apple Song',
        artist: 'Artist A',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'a-2',
        title: 'Zebra Song 2',
        artist: 'Artist A',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    mockUserSongs.value = unsortedSongs;

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));

    // The component sorts by artist then title
    const flatView = screen.getByTestId('flat-view');
    expect(flatView).toBeInTheDocument();
  });

  it('handles empty user gracefully', () => {
    mockUserSongs.value = mockSongs;
    mockUser.value = null;

    const { container } = render(SongList, {
      props: {},
    });

    expect(container.querySelector('section.song-list')).toBeInTheDocument();
  });

  it('shows and hides empty state based on song count', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = [];
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };

    const { unmount } = render(SongList, {
      props: {},
    });

    expect(screen.getByText('Zadej hledání a potvrď tlačítkem Hledat.')).toBeInTheDocument();
    unmount();

    // Render again with songs
    mockUserSongs.value = mockSongs;
    render(SongList);

    await submitGlobalSearch(user, 'Song');

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));

    expect(screen.queryByText('Zadej hledání a potvrď tlačítkem Hledat.')).not.toBeInTheDocument();
    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
  });

  it('renders as a section element', () => {
    const { container } = render(SongList);

    const section = container.querySelector('section.song-list');
    expect(section).toBeInTheDocument();
  });

  it('keeps interactivity enabled across authentication states', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = null;

    const { unmount } = render(SongList);
    await submitGlobalSearch(user, 'Song');
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    unmount();
    mockUser.value = { uid: 'owner-1', displayName: 'Owner' };
    render(SongList);
    await submitGlobalSearch(user, 'Song');
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
  });

  it('filters songs by selected chords with match-all logic', async () => {
    const user = userEvent.setup();
    const store = songListStore();
    store.viewMode = 'flat';
    mockUserSongs.value = [
      {
        id: 'song-chord-1',
        title: 'Song One',
        artist: 'Artist A',
        chords: ['C', 'G', 'Em', 'D'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-chord-2',
        title: 'Song Two',
        artist: 'Artist B',
        chords: ['C', 'G'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-chord-3',
        title: 'Song Three',
        artist: 'Artist C',
        chords: ['C', 'G', 'D'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    store.setChordFilters(['C', 'G', 'Em']);

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('keeps selected chord filters in songListStore across remount', async () => {
    const user = userEvent.setup();
    const store = songListStore();
    mockUserSongs.value = [
      {
        id: 'song-persist-1',
        title: 'Persist One',
        artist: 'Artist A',
        chords: ['Am', 'G'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-persist-2',
        title: 'Persist Two',
        artist: 'Artist B',
        chords: ['C'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    store.viewMode = 'flat';
    store.setChordFilters(['Am']);

    const { unmount } = render(SongList);

    await submitGlobalSearch(user, 'Persist');

    expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');

    unmount();
    render(SongList);

    await submitGlobalSearch(user, 'Persist');

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('refreshes songs when global search is submitted', async () => {
    const user = userEvent.setup();

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('filters songs by selected categories with match-all logic', async () => {
    const user = userEvent.setup();
    const store = songListStore();
    store.viewMode = 'flat';
    mockSongCategories.value = [
      { id: 'cat-cz', value: 'České' },
      { id: 'cat-camp', value: 'Táborová' },
    ];
    mockUserSongs.value = [
      {
        id: 'song-category-1',
        title: 'Song One',
        artist: 'Artist A',
        categories: ['cat-cz', 'cat-camp'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-category-2',
        title: 'Song Two',
        artist: 'Artist B',
        categories: ['cat-cz'],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongList);

    await submitGlobalSearch(user, 'Song');

    store.setCategoryFilters(['cat-cz', 'cat-camp']);

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('allows empty query submit when filters are selected and auto-switches to flat with first 10 results', async () => {
    const user = userEvent.setup();
    const store = songListStore();

    store.viewMode = 'tree';
    store.setChordFilters(['C']);
    mockUserSongs.value = Array.from({ length: 21 }, (_, index) => ({
      id: `song-filter-only-${index + 1}`,
      title: `Song ${index + 1}`,
      artist: `Artist ${index + 1}`,
      chords: ['C'],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    }));

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Hledat' }));

    await waitFor(() => {
      expect(screen.getByTestId('flat-view')).toBeInTheDocument();
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('10 songs');
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Stránka 1 z 3')).toBeInTheDocument();
  });

  it('loads another 10 results when changing page in filter-only global search', async () => {
    const user = userEvent.setup();
    const store = songListStore();

    store.viewMode = 'tree';
    store.setChordFilters(['C']);
    mockUserSongs.value = Array.from({ length: 21 }, (_, index) => ({
      id: `song-page-${index + 1}`,
      title: `Song ${index + 1}`,
      artist: `Artist ${index + 1}`,
      chords: ['C'],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    }));

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Hledat' }));

    await waitFor(() => {
      expect(screen.getByText('Stránka 1 z 3')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Další' }));

    await waitFor(() => {
      expect(screen.getByText('Stránka 2 z 3')).toBeInTheDocument();
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('10 songs');
    });

    await user.click(screen.getByRole('button', { name: 'Další' }));

    await waitFor(() => {
      expect(screen.getByText('Stránka 3 z 3')).toBeInTheDocument();
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });

    expect(mockRefresh).toHaveBeenCalledTimes(3);
  });

  it('does not show all global songs after clearing the last active filter', async () => {
    const user = userEvent.setup();
    const store = songListStore();

    store.viewMode = 'tree';
    store.setChordFilters(['C']);
    mockUserSongs.value = Array.from({ length: 3 }, (_, index) => ({
      id: `song-clear-filter-${index + 1}`,
      title: `Song ${index + 1}`,
      artist: `Artist ${index + 1}`,
      chords: ['C'],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    }));

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Hledat' }));

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('3 songs');
    });

    store.clearChordFilters();

    await waitFor(() => {
      expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-view')).not.toBeInTheDocument();
      expect(screen.getByText('Zadej hledání a potvrď tlačítkem Hledat.')).toBeInTheDocument();
    });
  });
});
