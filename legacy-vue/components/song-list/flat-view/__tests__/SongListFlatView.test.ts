import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SongListFlatView from '../SongListFlatView.vue';
import type { Song } from '../../../../lib/song';
import type { Timestamp } from 'firebase/firestore';

describe('SongListFlatView', () => {
  const mockOnSongClick = vi.fn();

  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
    {
      id: 'song-2',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      chords: [],
      createdAt: new Date().toISOString() as unknown as Timestamp,
      ownerId: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of songs in flat view', () => {
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('displays song in "artist - title" format', () => {
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    expect(screen.getByText('Queen - Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Led Zeppelin - Stairway to Heaven')).toBeInTheDocument();
  });

  it('calls onSongClick with correct song when clicked', async () => {
    const user = userEvent.setup();
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const songItem = screen.getByText('Queen - Bohemian Rhapsody');
    await user.click(songItem);

    expect(mockOnSongClick).toHaveBeenCalledWith(mockSongs[0]);
    expect(mockOnSongClick).toHaveBeenCalledTimes(1);
  });

  it('handles multiple song clicks correctly', async () => {
    const user = userEvent.setup();
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    await user.click(screen.getByText('Queen - Bohemian Rhapsody'));
    await user.click(screen.getByText('Led Zeppelin - Stairway to Heaven'));

    expect(mockOnSongClick).toHaveBeenCalledTimes(2);
    expect(mockOnSongClick).toHaveBeenNthCalledWith(1, mockSongs[0]);
    expect(mockOnSongClick).toHaveBeenNthCalledWith(2, mockSongs[1]);
  });

  it('applies readonly styling when not interactive', () => {
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: false,
      },
    });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).toHaveClass('song-list__item--readonly');
    });
  });

  it('sets aria-disabled attribute when not interactive', () => {
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: false,
      },
    });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('does not apply readonly styling when interactive', () => {
    render(SongListFlatView, {
      props: {
        songs: mockSongs,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).not.toHaveClass('song-list__item--readonly');
    });
  });

  it('renders empty list when no songs provided', () => {
    render(SongListFlatView, {
      props: {
        songs: [],
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    const items = screen.queryAllByRole('listitem');
    expect(items).toHaveLength(0);
  });

  it('handles special characters in song data', () => {
    const songsWithSpecialChars: Song[] = [
      {
        id: 'song-with-special',
        title: "Don't Stop Believin'",
        artist: 'Journey',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
      {
        id: 'song-with-unicode',
        title: 'La Vie en Rose',
        artist: 'Édith Piaf',
        chords: [],
        createdAt: new Date().toISOString() as unknown as Timestamp,
        ownerId: '',
      },
    ];

    render(SongListFlatView, {
      props: {
        songs: songsWithSpecialChars,
        onSongClick: mockOnSongClick,
        isInteractive: true,
      },
    });

    expect(screen.getByText("Journey - Don't Stop Believin'")).toBeInTheDocument();
    expect(screen.getByText('Édith Piaf - La Vie en Rose')).toBeInTheDocument();
  });
});
