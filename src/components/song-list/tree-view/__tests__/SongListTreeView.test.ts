import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SongListTreeView from '../SongListTreeView.vue';
import type { Song } from '../../../../lib/song';
import type { Timestamp } from 'firebase/firestore';

describe('SongListTreeView', () => {
  const mockOnSongClick = vi.fn();

  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Another One Bites the Dust',
      artist: 'Queen',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
    {
      id: 'song-2',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
    {
      id: 'song-3',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
    {
      id: 'song-4',
      title: 'Black Dog',
      artist: 'Led Zeppelin',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tree view with artist branches', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    expect(screen.getByText('Interpreti')).toBeInTheDocument();
    expect(screen.getByText('Led Zeppelin')).toBeInTheDocument();
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('groups songs by artist correctly', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const queenBranch = screen.getByText('Queen');
    const zeppelinBranch = screen.getByText('Led Zeppelin');

    expect(queenBranch).toBeInTheDocument();
    expect(zeppelinBranch).toBeInTheDocument();
  });

  it('displays individual songs under artist branches', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    expect(screen.getByText('Another One Bites the Dust')).toBeInTheDocument();
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
    expect(screen.getByText('Black Dog')).toBeInTheDocument();
  });

  it('calls onSongClick with correct song when clicked', async () => {
    const user = userEvent.setup();
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const songItem = screen.getByText('Bohemian Rhapsody');
    await user.click(songItem);

    expect(mockOnSongClick).toHaveBeenCalledWith(mockSongs[1]);
    expect(mockOnSongClick).toHaveBeenCalledTimes(1);
  });

  it('handles multiple song clicks from different artists', async () => {
    const user = userEvent.setup();
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    await user.click(screen.getByText('Bohemian Rhapsody'));
    await user.click(screen.getByText('Stairway to Heaven'));

    expect(mockOnSongClick).toHaveBeenCalledTimes(2);
    expect(mockOnSongClick).toHaveBeenNthCalledWith(1, mockSongs[1]);
    expect(mockOnSongClick).toHaveBeenNthCalledWith(2, mockSongs[2]);
  });

  it('applies readonly styling when not interactive', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: false,
      },
    });

    const songItems = screen.getAllByText(/Bohemian Rhapsody|Another One Bites|Stairway|Black Dog/);
    expect(songItems.length).toBeGreaterThan(0);
    songItems.forEach((item) => {
      const li = item.closest('li[class*="tree-item"]');
      if (li) {
        expect(li).toHaveClass('song-list__tree-item--readonly');
      }
    });
  });

  it('sets aria-disabled attribute when not interactive', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: false,
      },
    });

    const songItems = screen.getAllByText(/Bohemian Rhapsody|Another One Bites|Stairway|Black Dog/);
    expect(songItems.length).toBeGreaterThan(0);
    songItems.forEach((item) => {
      const li = item.closest('li[class*="tree-item"]');
      if (li) {
        expect(li).toHaveAttribute('aria-disabled', 'true');
      }
    });
  });

  it('does not apply readonly styling when interactive', () => {
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const songItems = screen.getAllByText(/Bohemian Rhapsody|Another One Bites|Stairway|Black Dog/);
    expect(songItems.length).toBeGreaterThan(0);
    songItems.forEach((item) => {
      const li = item.closest('li[class*="tree-item"]');
      if (li) {
        expect(li).not.toHaveClass('song-list__tree-item--readonly');
      }
    });
  });

  it('renders artist label correctly', () => {
    const customLabel = 'Hudebníci';
    render(SongListTreeView, {
      props: {
        songs: mockSongs,
        artistsLabel: customLabel,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    expect(screen.getByText(customLabel)).toBeInTheDocument();
  });

  it('renders empty tree when no songs provided', () => {
    render(SongListTreeView, {
      props: {
        songs: [],
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const artistLabel = screen.getByText('Interpreti');
    expect(artistLabel).toBeInTheDocument();
  });

  it('handles songs with same title but different artists', async () => {
    const user = userEvent.setup();
    const songsWithDuplicates: Song[] = [
      {
        id: 'song-rain-1',
        title: 'Rain',
        artist: 'The Beatles',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-rain-2',
        title: 'Rain',
        artist: 'System of a Down',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongListTreeView, {
      props: {
        songs: songsWithDuplicates,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const rainItems = screen.getAllByText('Rain');
    expect(rainItems.length).toBeGreaterThanOrEqual(2);

    await user.click(rainItems[0] as HTMLElement);
    expect(mockOnSongClick).toHaveBeenCalledWith(songsWithDuplicates[0]);
  });

  it('sorts artists alphabetically', () => {
    const unsortedSongs: Song[] = [
      {
        id: 's1',
        title: 'Song 1',
        artist: 'Zebra Band',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 's2',
        title: 'Song 2',
        artist: 'Apple Music',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 's3',
        title: 'Song 3',
        artist: 'Banana Group',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    const { container } = render(SongListTreeView, {
      props: {
        songs: unsortedSongs,
        artistsLabel: 'Interpreti',
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const artistElements = container.querySelectorAll('.song-list__branch-text');
    const artistTexts = Array.from(artistElements)
      .map((el) => el.textContent?.trim())
      .filter((text) => text && text !== 'Songs');

    expect(artistTexts).toContain('Apple Music');
    expect(artistTexts).toContain('Banana Group');
    expect(artistTexts).toContain('Zebra Band');
  });
});
