import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTagSuggestions } from '../useTagSuggestions';

const lib = vi.hoisted(() => ({ fetchAllSongCategories: vi.fn() }));
vi.mock('../../../lib/song', () => lib);

describe('useTagSuggestions', () => {
  beforeEach(() => {
    lib.fetchAllSongCategories.mockReset();
  });

  it('loads the labels of every existing tag', async () => {
    lib.fetchAllSongCategories.mockResolvedValue([
      { id: 'c1', value: 'Folk' },
      { id: 'c2', value: 'Táborák' },
    ]);
    const { result } = renderHook(() => useTagSuggestions());

    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toEqual(['Folk', 'Táborák']));
  });

  it('stays empty when loading fails', async () => {
    lib.fetchAllSongCategories.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTagSuggestions());

    await waitFor(() => expect(lib.fetchAllSongCategories).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });
});
