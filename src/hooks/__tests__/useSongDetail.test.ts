import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSongDetail } from '../useSongDetail';
import type { Song } from '../../lib/song';
import { forgetLoadedSongs, MAX_LOADED_SONGS, useLoadedSongsStore } from '../../stores/loadedSongs';

type Listener = {
  songId: string;
  onChange: (song: Song | null) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const listeners: Listener[] = [];

vi.mock('../../lib/song', () => ({
  subscribeToSong: (
    songId: string,
    onChange: Listener['onChange'],
    onError: Listener['onError']
  ) => {
    const unsubscribe = vi.fn();
    listeners.push({ songId, onChange, onError, unsubscribe });
    return unsubscribe;
  },
}));

const renderSongDetail = (songId: string | null) =>
  renderHook(({ id }) => useSongDetail(id), { initialProps: { id: songId } });

const knockin: Song = {
  id: 'song-1',
  title: "Knockin on Heaven's Door",
  artist: 'Bob Dylan',
  text: '[verse] [G]Mama',
  ownerId: '',
};

describe('useSongDetail', () => {
  beforeEach(() => {
    forgetLoadedSongs();
    listeners.length = 0;
  });

  it('does not listen without a song id', () => {
    const { result } = renderSongDetail('');

    expect(result.current).toEqual({ song: null, songError: null, songLoading: false });
    expect(listeners).toHaveLength(0);
  });

  it('loads until the song arrives, then follows its changes', () => {
    const { result } = renderSongDetail('song-1');

    expect(listeners[0]?.songId).toBe('song-1');
    expect(result.current.songLoading).toBe(true);

    act(() => listeners[0]?.onChange(knockin));
    expect(result.current).toEqual({ song: knockin, songError: null, songLoading: false });

    act(() => listeners[0]?.onChange({ ...knockin, title: 'Renamed' }));
    expect(result.current.song?.title).toBe('Renamed');
  });

  it('reports a song that does not exist as null, not loading', () => {
    const { result } = renderSongDetail('missing');

    act(() => listeners[0]?.onChange(null));

    expect(result.current).toEqual({ song: null, songError: null, songLoading: false });
  });

  it('reports a failed load and tries again on the next visit', () => {
    const { result, unmount } = renderSongDetail('song-1');

    act(() => listeners[0]?.onError(new Error('offline')));

    expect(result.current.songError).toBe('Chyba při načítání písně. offline');
    expect(result.current.songLoading).toBe(false);
    expect(listeners[0]?.unsubscribe).toHaveBeenCalled();

    unmount();
    renderSongDetail('song-1');

    expect(listeners).toHaveLength(2);
  });

  it('keeps the previous song visible while the next loads', () => {
    const { result, rerender } = renderSongDetail('song-1');
    act(() => listeners[0]?.onChange(knockin));

    rerender({ id: 'song-2' });

    expect(listeners[1]?.songId).toBe('song-2');
    expect(result.current).toEqual({ song: knockin, songError: null, songLoading: true });
  });

  it('shows a song it already loaded at once and without reading it again', () => {
    const { result, rerender } = renderSongDetail('song-1');
    act(() => listeners[0]?.onChange(knockin));
    rerender({ id: 'song-2' });

    rerender({ id: 'song-1' });

    expect(listeners).toHaveLength(2);
    expect(listeners[0]?.unsubscribe).not.toHaveBeenCalled();
    expect(result.current).toEqual({ song: knockin, songError: null, songLoading: false });
  });

  it('keeps a loaded song current after leaving its page', () => {
    const { result, rerender } = renderSongDetail('song-1');
    act(() => listeners[0]?.onChange(knockin));
    rerender({ id: 'song-2' });

    act(() => listeners[0]?.onChange({ ...knockin, title: 'Renamed' }));
    rerender({ id: 'song-1' });

    expect(result.current.song?.title).toBe('Renamed');
  });

  it('forgets the least recently opened song past the limit', () => {
    const { rerender } = renderSongDetail('song-0');
    act(() => listeners[0]?.onChange(knockin));

    for (let index = 1; index < MAX_LOADED_SONGS; index++) {
      rerender({ id: `song-${index}` });
    }
    // Opening the first song again makes the second one the oldest.
    rerender({ id: 'song-0' });
    expect(listeners).toHaveLength(MAX_LOADED_SONGS);

    rerender({ id: 'one-too-many' });

    expect(listeners[0]?.unsubscribe).not.toHaveBeenCalled();
    expect(listeners[1]?.unsubscribe).toHaveBeenCalled();
    expect(useLoadedSongsStore.getState().songs['song-0']).toBeDefined();
  });
});
