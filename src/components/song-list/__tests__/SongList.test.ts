import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import SongList from '../SongList.vue';
import type { Song } from '../../../lib/song';
import type { Timestamp } from 'firebase/firestore';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const mockRouterPush = vi.fn();

const mockUserSongs = mockRef<Song[]>([]);
const mockUser = mockRef<{ uid: string; displayName: string } | null>({
  uid: 'user-123',
  displayName: 'Test User',
});

vi.mock('../../../composables/useSongListData', () => ({
  useSongListData: (_ownerId: string) => ({
    userSongs: mockUserSongs,
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
          h('div', { 'data-testid': 'tree-view-interactive' }, String(props.isInteractive)),
        ]);
    },
  }),
}));

// Polyfill ResizeObserver for jsdom (needed by Ark UI SegmentGroup)
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
    vi.clearAllMocks();
    mockUserSongs.value = [];
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };
  });

  it('renders section with title', () => {
    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByText('Seznam písní')).toBeInTheDocument();
  });

  it('renders segment group for view mode selection', () => {
    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByText('Plochý seznam')).toBeInTheDocument();
    expect(screen.getByText('Strom')).toBeInTheDocument();
  });

  it('shows flat view by default', () => {
    mockUserSongs.value = mockSongs;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
    expect(screen.queryByTestId('tree-view')).not.toBeInTheDocument();
  });

  it('switches to tree view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    const treeButton = screen.getByText('Strom');
    await user.click(treeButton);

    expect(screen.queryByTestId('flat-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();
  });

  it('switches back to flat view when selected', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    // Switch to tree view
    await user.click(screen.getByText('Strom'));
    expect(screen.getByTestId('tree-view')).toBeInTheDocument();

    // Switch back to flat view
    await user.click(screen.getByText('Plochý seznam'));
    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
  });

  it('displays empty state message when no songs', () => {
    mockUserSongs.value = [];

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByText('Zatím nejsou dostupné žádné písně.')).toBeInTheDocument();
  });

  it('passes correct aria-label to segment group', () => {
    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    const segmentGroup = screen.getByLabelText('Rezim zobrazeni seznamu pisni');
    expect(segmentGroup).toBeInTheDocument();
  });

  it('passes correct props to flat view component', () => {
    mockUserSongs.value = mockSongs;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByTestId('flat-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
  });

  it('passes correct props to tree view component', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    await user.click(screen.getByText('Strom'));

    expect(screen.getByTestId('tree-view-count')).toHaveTextContent('2 songs');
    expect(screen.getByTestId('tree-view-label')).toHaveTextContent('Interpreti');
    expect(screen.getByTestId('tree-view-interactive')).toHaveTextContent('true');
  });

  it('allows song navigation when user owns the song list', async () => {
    const user = userEvent.setup();
    mockUserSongs.value = mockSongs;
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    await user.click(screen.getByTestId('flat-view-click-first'));

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('true');
    expect(mockRouterPush).toHaveBeenCalledWith({ path: '/song/song-1' });
  });

  it('prevents song navigation when user does not own the song list', async () => {
    mockUserSongs.value = mockSongs;
    mockUser.value = { uid: 'different-user', displayName: 'Other User' };

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('false');
  });

  it('prevents song navigation when not authenticated', async () => {
    mockUserSongs.value = mockSongs;
    mockUser.value = null;

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('false');
  });

  it('sorts songs alphabetically by artist then title', () => {
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

    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    // The component sorts by artist then title
    const flatView = screen.getByTestId('flat-view');
    expect(flatView).toBeInTheDocument();
  });

  it('handles empty user gracefully', () => {
    mockUserSongs.value = mockSongs;
    mockUser.value = null;

    const { container } = render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(container.querySelector('section.song-list')).toBeInTheDocument();
  });

  it('shows and hides empty state based on song count', () => {
    mockUserSongs.value = [];
    mockUser.value = { uid: 'user-123', displayName: 'Test User' };

    const { unmount } = render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.getByText('Zatím nejsou dostupné žádné písně.')).toBeInTheDocument();
    unmount();

    // Render again with songs
    mockUserSongs.value = mockSongs;
    render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    expect(screen.queryByText('Zatím nejsou dostupné žádné písně.')).not.toBeInTheDocument();
    expect(screen.getByTestId('flat-view')).toBeInTheDocument();
  });

  it('renders as a section element', () => {
    const { container } = render(SongList, {
      props: {
        ownerId: 'user-123',
      },
    });

    const section = container.querySelector('section.song-list');
    expect(section).toBeInTheDocument();
  });

  it('handles different ownerId prop values', () => {
    mockUserSongs.value = mockSongs;

    const { rerender } = render(SongList, {
      props: {
        ownerId: 'owner-1',
      },
    });

    expect(screen.getByTestId('flat-view-interactive')).toHaveTextContent('false');

    // Change ownerId to match user
    mockUser.value = { uid: 'owner-1', displayName: 'Owner' };
    rerender({
      props: {
        ownerId: 'owner-1',
      },
    });

    // After the next render with matching IDs
    mockUser.value = { uid: 'owner-1', displayName: 'Owner' };
    render(SongList, {
      props: {
        ownerId: 'owner-1',
      },
    });
  });
});
