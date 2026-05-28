import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';
import { render, waitFor } from '@testing-library/vue';
import { useSongDetail } from '../useSongDetail';
import type { Song } from '../../lib/song';

const mocks = vi.hoisted(() => ({
  getSong: vi.fn(),
  refreshSong: vi.fn(),
}));

vi.mock('../../stores/song', () => ({
  useSongStore: () => ({
    getSong: mocks.getSong,
    refreshSong: mocks.refreshSong,
  }),
}));

function mountComposable(songId: Ref<string | null>): ReturnType<typeof useSongDetail> {
  let state: ReturnType<typeof useSongDetail> | null = null;

  const Harness = defineComponent({
    setup() {
      state = useSongDetail(songId);
      return () => null;
    },
  });

  render(Harness);

  if (state == null) {
    throw new Error('Composable state was not initialized');
  }

  return state as ReturnType<typeof useSongDetail>;
}

describe('useSongDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValue(null);
  });

  it('returns null song and no error for empty song id', async () => {
    const songId = ref<string | null>('');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(state.song.value).toBeNull();
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
      expect(mocks.getSong).not.toHaveBeenCalled();
      expect(mocks.refreshSong).not.toHaveBeenCalled();
    });
  });

  it('loads song from cache when cached song has text', async () => {
    const loadedSong: Song = {
      id: 'song-1',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      text: '[verse] [G]Mama',
      chords: ['G'],
      ownerId: '',
    };

    mocks.getSong.mockResolvedValue(loadedSong);

    const songId = ref<string | null>('song-1');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).not.toHaveBeenCalled();
      expect(state.song.value).toEqual(loadedSong);
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
    });
  });

  it('fetches full song when cache is missing', async () => {
    const loadedSong: Song = {
      id: 'song-1',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      text: '[verse] [G]Mama',
      chords: ['G'],
      ownerId: '',
    };

    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValue(loadedSong);

    const songId = ref<string | null>('song-1');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).toHaveBeenCalledWith('song-1');
      expect(state.song.value).toEqual(loadedSong);
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
    });
  });

  it('fetches full song when cached song has no text', async () => {
    const cachedSong: Song = {
      id: 'song-1',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      ownerId: '',
    };
    const loadedSong: Song = {
      ...cachedSong,
      text: '[verse] [G]Mama',
      chords: ['G'],
    };

    mocks.getSong.mockResolvedValue(cachedSong);
    mocks.refreshSong.mockResolvedValue(loadedSong);

    const songId = ref<string | null>('song-1');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(mocks.getSong).toHaveBeenCalledWith('song-1');
      expect(mocks.refreshSong).toHaveBeenCalledWith('song-1');
      expect(state.song.value).toEqual(loadedSong);
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
    });
  });

  it('sets formatted error message when fetching fails', async () => {
    mocks.refreshSong.mockRejectedValue(new Error('network down'));

    const songId = ref<string | null>('song-1');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(state.song.value).toBeNull();
      expect(state.songError.value).toContain('Chyba při načítání písně.');
      expect(state.songError.value).toContain('network down');
      expect(state.songLoading.value).toBe(false);
    });
  });

  it('reloads when song id changes', async () => {
    const songA: Song = { id: 'song-a', title: 'A', artist: 'Artist A', ownerId: '' };
    const songB: Song = { id: 'song-b', title: 'B', artist: 'Artist B', ownerId: '' };

    mocks.getSong.mockResolvedValue(null);
    mocks.refreshSong.mockResolvedValueOnce(songA).mockResolvedValueOnce(songB);

    const songId = ref<string | null>('song-a');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(state.song.value?.id).toBe('song-a');
    });

    songId.value = 'song-b';

    await waitFor(() => {
      expect(mocks.refreshSong).toHaveBeenNthCalledWith(2, 'song-b');
      expect(state.song.value?.id).toBe('song-b');
    });
  });
});
