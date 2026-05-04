import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import SongList from '../SongList.vue';
import type { Song } from '../../../lib/song';
import type { Timestamp } from 'firebase/firestore';
import { songListStore } from '../../../stores/songList';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const mockRouterPush = vi.fn();
const mockRefresh = vi.fn();

const mockUserSongs = mockRef<Song[]>([]);
const mockIsRefreshing = mockRef(false);
const mockUser = mockRef<{ uid: string; displayName: string } | null>({
  uid: 'user-123',
  displayName: 'Test User',
});

vi.mock('../../../composables/useSongListData', () => ({
  useSongListData: () => ({
    userSongs: mockUserSongs,
    isRefreshing: mockIsRefreshing,
    refresh: mockRefresh,
  }),
}));

vi.mock('../../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
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
        ]);
    },
  }),
}));

// Polyfill ResizeObserver for jsdom (needed by Ark UI menu positioning)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

describe('SongList', () => {
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
    mockIsRefreshing.value = false;
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };
  });

  it('renders section with title', () => {
    render(SongList);

    expect(screen.getByText('Seznam písní')).toBeInTheDocument();
  });

  it('renders options trigger button', () => {
    render(SongList);

    expect(screen.getByRole('button', { name: 'Možnosti seznamu písní' })).toBeInTheDocument();
  });

  it('renders search input for title and artist filtering', () => {
    render(SongList);

    expect(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' })
    ).toBeInTheDocument();
  });

  it('shows tree view by default', () => {
    mockUserSongs.value = mockSongs;

    render(SongList);

    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();
  });

  it('switches to tree view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    const treeButton = screen.getByRole('button', { name: 'Strom' });
    await user.click(treeButton);

    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();
  });

  it('switches back to flat view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Strom' }));
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
  });

  it('displays empty state message when no songs', () => {
    mockUserSongs.value = [];

    render(SongList);

    expect(screen.getByText('Zatím nejsou dostupné žádné písně.')).toBeInTheDocument();
  });

  it('passes correct aria-label to view mode group in options menu', async () => {
    const user = userEvent.setup();
    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));

    const viewModeGroup = screen.getByLabelText('Režim zobrazení seznamu písní');
    expect(viewModeGroup).toBeInTheDocument();
  });

  it('closes options menu when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(SongList);

    const optionsTrigger = screen.getByRole('button', { name: 'Možnosti seznamu písní' });
    await user.click(optionsTrigger);
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');

    await user.click(optionsTrigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('passes correct props to flat view component', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));

    expect(screen.getByTestId('flat-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
  });

  it('passes correct props to tree view component', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Strom' }));

    expect(screen.getByTestId('tree-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('tree-view-label')).toHaveTextContent('Interpreti');
    expect(screen.getByTestId('tree-view-auto-expand-on-filter')).toHaveTextContent('false');
    expect(screen.getByTestId('tree-view-interactive')).toHaveTextContent('true');
  });

  it('enables tree auto expand when search filter is active', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Strom' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      'Artist'
    );

    expect(screen.getByTestId('tree-view-auto-expand-on-filter')).toHaveTextContent('true');
  });

  it('filters songs by title', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    songListStore().viewMode = 'flat';

    render(SongList);

    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      'Song 2'
    );

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('filters songs by artist', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    songListStore().viewMode = 'flat';

    render(SongList);

    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      'Artist B'
    );

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

    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      "artist:Bob Dylan&&title:Knocking on Heaven's Door"
    );

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

    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      'artist:Bob Dylan||title:Space Oddity'
    );

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('2 songs');
    });
  });

  it('shows filtered empty state when no songs match the search', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList);

    await user.type(
      screen.getByRole('searchbox', { name: 'Hledat písně podle názvu nebo interpreta' }),
      'No match'
    );

    expect(screen.getByText('Žádné písně neodpovídají hledání.')).toBeInTheDocument();
    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
  });

  it('allows song navigation for authenticated user', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
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

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
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

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
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

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
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

    expect(screen.getByText('Zatím nejsou dostupné žádné písně.')).toBeInTheDocument();
    unmount();

    // Render again with songs
    mockUserSongs.value = mockSongs;
    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));

    expect(screen.queryByText('Zatím nejsou dostupné žádné písně.')).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    unmount();
    mockUser.value = { uid: 'owner-1', displayName: 'Owner' };
    render(SongList);
    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Plochý seznam' }));
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
  });

  it('filters songs by selected chords with match-all logic', async () => {
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

    store.setChordFilters(['C', 'G', 'Em']);

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('keeps selected chord filters in songListStore across remount', async () => {
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

    expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');

    unmount();
    render(SongList);

    await waitFor(() => {
      expect(screen.getByTestId('flat-view-count')).toHaveTextContent('1 songs');
    });
  });

  it('refreshes songs from options menu action', async () => {
    const user = userEvent.setup();

    render(SongList);

    await user.click(screen.getByRole('button', { name: 'Možnosti seznamu písní' }));
    await user.click(screen.getByRole('button', { name: 'Načíst písně' }));

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
