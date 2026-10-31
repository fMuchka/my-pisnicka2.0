import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSongTags } from '../useSongTags';

const lib = vi.hoisted(() => ({ fetchSongTagLabels: vi.fn() }));
vi.mock('../../../lib/song', () => lib);

describe('useSongTags', () => {
  beforeEach(() => {
    lib.fetchSongTagLabels.mockReset();
  });

  it('has no tags and loads nothing for a new song', () => {
    const { result } = renderHook(() => useSongTags(null));

    expect(result.current).toEqual({ isLoading: false, tags: [] });
    expect(lib.fetchSongTagLabels).not.toHaveBeenCalled();
  });

  it('loads the tags of a song', async () => {
    lib.fetchSongTagLabels.mockResolvedValue(['folk', 'táborák']);
    const { result } = renderHook(() => useSongTags('s1'));

    expect(result.current).toEqual({ isLoading: true, tags: null });
    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, tags: ['folk', 'táborák'] })
    );
    expect(lib.fetchSongTagLabels).toHaveBeenCalledWith('s1');
  });

  it('reports unknown tags when loading fails', async () => {
    lib.fetchSongTagLabels.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSongTags('s1'));

    await waitFor(() => expect(result.current).toEqual({ isLoading: false, tags: null }));
  });

  it('loads again the next time, so a reopened editor sees what was saved since', async () => {
    lib.fetchSongTagLabels.mockResolvedValueOnce(['folk']).mockResolvedValueOnce(['rock']);
    const { result, rerender } = renderHook(({ songId }) => useSongTags(songId), {
      initialProps: { songId: 's1' as string | null },
    });
    await waitFor(() => expect(result.current.tags).toEqual(['folk']));

    rerender({ songId: null });
    rerender({ songId: 's1' });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.tags).toEqual(['rock']));
  });
});
