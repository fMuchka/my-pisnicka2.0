import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSongDetail } from '../useSongDetail';
import type { Song } from '../../lib/song';

const mocks = vi.hoisted(() => ({
  getSong: vi.fn(),
  refreshSong: vi.fn(),
}));

vi.mock('../../stores/song', () => ({
  useSongStore: {
    getState: () => ({
      getSong: mocks.getSong,
      refreshSong: mocks.refreshSong,
    }),
  },
}));

const renderSongDetail = (songId: string | null) =>
  renderHook(({ id }) => useSongDetail(id), { initialProps: { id: songId } });

const knockin: Song = {
  id: 'song-1',
  title: "Knockin on Heaven's Door",
  artist: 'Bob Dylan',
  text: '[verse] [G]Mama',
  chords: ['G'],
  ownerId: '',
};

describe('useSongDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValue(null);
  });

  it('returns null song and no error for empty song id', async () => {
    const { result } = renderSongDetail('');

    await waitFor(() => {
      expect(result.current.song).toBeNull();
      expect(result.current.songError).toBeNull();
      expect(result.current.songLoading).toBe(false);
      expect(mocks.getSong).not.toHaveBeenCalled();
      expect(mocks.refreshSong).not.toHaveBeenCalled();
    });
  });

  it('loads song from cache when cached song has text', async () => {
    mocks.getSong.mockResolvedValue(knockin);

    const { result } = renderSongDetail('song-1');

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).not.toHaveBeenCalled();
      expect(result.current.song).toEqual(knockin);
      expect(result.current.songError).toBeNull();
      expect(result.current.songLoading).toBe(false);
    });
  });

  it('fetches full song when cache is missing', async () => {
    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValue(knockin);

    const { result } = renderSongDetail('song-1');

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).toHaveBeenCalledWith('song-1');
      expect(result.current.song).toEqual(knockin);
      expect(result.current.songError).toBeNull();
      expect(result.current.songLoading).toBe(false);
    });
  });

  it('fetches full song when cached song has no text', async () => {
    const { text: _text, chords: _chords, ...cachedSong } = knockin;

    mocks.getSong.mockResolvedValue(cachedSong);
    mocks.refreshSong.mockResolvedValue(knockin);

    const { result } = renderSongDetail('song-1');

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).toHaveBeenCalledWith('song-1');
      expect(result.current.song).toEqual(knockin);
      expect(result.current.songError).toBeNull();
      expect(result.current.songLoading).toBe(false);
    });
  });

  it('sets formatted error message when fetching fails', async () => {
    mocks.refreshSong.mockRejectedValue(new Error('network down'));

    const { result } = renderSongDetail('song-1');

    await waitFor(() => {
      expect(result.current.song).toBeNull();
      expect(result.current.songError).toContain('Chyba při načítání písně.');
      expect(result.current.songError).toContain('network down');
      expect(result.current.songLoading).toBe(false);
    });
  });

  it('reloads when song id changes', async () => {
    const songA: Song = { id: 'song-a', title: 'A', artist: 'Artist A', ownerId: '' };
    const songB: Song = { id: 'song-b', title: 'B', artist: 'Artist B', ownerId: '' };

    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValueOnce(songA).mockResolvedValueOnce(songB);

    const { result, rerender } = renderSongDetail('song-a');

    await waitFor(() => {
      expect(result.current.song?.id).toBe('song-a');
    });

    rerender({ id: 'song-b' });
    expect(result.current.songLoading).toBe(true);

    await waitFor(() => {
      expect(mocks.refreshSong).toHaveBeenNthCalledWith(2, 'song-b');
      expect(result.current.song?.id).toBe('song-b');
    });
  });
});
