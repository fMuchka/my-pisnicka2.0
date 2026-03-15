import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';
import { render, waitFor } from '@testing-library/vue';
import { Timestamp } from 'firebase/firestore';
import { useHomeData } from '../useHomeData';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  mockFetchLatestSessions: vi.fn(),
  mockFetchHomeSongs: vi.fn(),
}));

vi.mock('../../lib/session', () => ({
  fetchLatestSessions: mocks.mockFetchLatestSessions,
}));

vi.mock('../../lib/song', () => ({
  fetchHomeSongs: mocks.mockFetchHomeSongs,
}));

function mountComposable(user: Ref<User | null>): ReturnType<typeof useHomeData> {
  let state: ReturnType<typeof useHomeData> | null = null;

  const Harness = defineComponent({
    setup() {
      state = useHomeData(user);
      return () => null;
    },
  });

  render(Harness);

  if (state == null) {
    throw new Error('Composable state was not initialized');
  }

  return state as ReturnType<typeof useHomeData>;
}

describe('useHomeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches sessions with current user id and then fetches songs', async () => {
    mocks.mockFetchLatestSessions.mockResolvedValue([]);
    mocks.mockFetchHomeSongs.mockResolvedValue([]);

    const user = ref({ uid: 'host-123' } as User);
    mountComposable(user);

    await waitFor(() => {
      expect(mocks.mockFetchLatestSessions).toHaveBeenCalledWith('host-123');
      expect(mocks.mockFetchHomeSongs).toHaveBeenCalledTimes(1);
    });
  });

  it('groups songs by artist in displaySongs', async () => {
    mocks.mockFetchLatestSessions.mockResolvedValue([]);
    mocks.mockFetchHomeSongs.mockResolvedValue([
      { id: 's1', title: 'Song A1', artist: 'Artist A', createdAt: Timestamp.now() },
      { id: 's2', title: 'Song A2', artist: 'Artist A', createdAt: Timestamp.now() },
      { id: 's3', title: 'Song B1', artist: 'Artist B', createdAt: Timestamp.now() },
    ]);

    const user = ref({ uid: 'host-123' } as User);
    const state = mountComposable(user);

    await waitFor(() => {
      expect(state.displaySongs.value['Artist A']?.length).toBe(2);
      expect(state.displaySongs.value['Artist B']?.length).toBe(1);
      expect(state.loadingSection.value).toBeNull();
    });
  });

  it('captures a sessions error message when loading fails', async () => {
    mocks.mockFetchLatestSessions.mockRejectedValue(new Error('network down'));
    mocks.mockFetchHomeSongs.mockResolvedValue([]);

    const user = ref({ uid: 'host-123' } as User);
    const state = mountComposable(user);

    await waitFor(() => {
      expect(state.sessionsError.value).toContain('Chyba při načítání relací');
      expect(state.sessionsError.value).toContain('network down');
      expect(mocks.mockFetchHomeSongs).toHaveBeenCalledTimes(1);
    });
  });

  it('does not fetch sessions when user is null but still fetches songs', async () => {
    mocks.mockFetchHomeSongs.mockResolvedValue([]);

    const user = ref(null);
    mountComposable(user);

    await waitFor(() => {
      expect(mocks.mockFetchLatestSessions).not.toHaveBeenCalled();
      expect(mocks.mockFetchHomeSongs).toHaveBeenCalledTimes(1);
    });
  });
});
