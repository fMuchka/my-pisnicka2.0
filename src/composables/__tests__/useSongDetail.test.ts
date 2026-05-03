import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';
import { render, waitFor } from '@testing-library/vue';
import { useSongDetail } from '../useSongDetail';
import type { Song } from '../../lib/song';

const mocks = vi.hoisted(() => ({
  fetchSongById: vi.fn(),
}));

vi.mock('../../lib/song', () => ({
  fetchSongById: mocks.fetchSongById,
}));

vi.mock('../../stores/song', () => ({
  useSongStore: () => ({
    getSong: vi.fn().mockResolvedValue(null),
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
  });

  it('returns null song and no error for empty song id', async () => {
    const songId = ref<string | null>('');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(state.song.value).toBeNull();
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
      expect(mocks.fetchSongById).not.toHaveBeenCalled();
    });
  });

  it('loads song when song id is present', async () => {
    const loadedSong: Song = {
      id: 'song-1',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      text: '[verse] [G]Mama',
      chords: ['G'],
      ownerId: '',
    };

    mocks.fetchSongById.mockResolvedValue(loadedSong);

    const songId = ref<string | null>('song-1');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(mocks.fetchSongById).toHaveBeenCalledWith('song-1');
      expect(state.song.value).toEqual(loadedSong);
      expect(state.songError.value).toBeNull();
      expect(state.songLoading.value).toBe(false);
    });
  });

  it('sets formatted error message when fetching fails', async () => {
    mocks.fetchSongById.mockRejectedValue(new Error('network down'));

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

    mocks.fetchSongById.mockResolvedValueOnce(songA).mockResolvedValueOnce(songB);

    const songId = ref<string | null>('song-a');
    const state = mountComposable(songId);

    await waitFor(() => {
      expect(state.song.value?.id).toBe('song-a');
    });

    songId.value = 'song-b';

    await waitFor(() => {
      expect(mocks.fetchSongById).toHaveBeenNthCalledWith(2, 'song-b');
      expect(state.song.value?.id).toBe('song-b');
    });
  });
});
