import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  joinSession as rawJoinSession,
  type JoinSessionResult,
  fetchLatestSessions,
  createSession,
} from '../session';

// Mock Firestore SDK used by session implementation
const mocks = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn(),
  mockCollection: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    collection: (...args: unknown[]) => mocks.mockCollection(...args),
    where: (...args: unknown[]) => mocks.mockWhere(...args),
    query: (...args: unknown[]) => mocks.mockQuery(...args),
    orderBy: (...args: unknown[]) => mocks.mockOrderBy(...args),
    limit: (...args: unknown[]) => mocks.mockLimit(...args),
    getDocs: (...args: unknown[]) => mocks.mockGetDocs(...args),
    addDoc: (...args: unknown[]) => mocks.mockAddDoc(...args),
    Timestamp: {
      now: () => ({ seconds: 1706745600, nanoseconds: 0 }),
      fromDate: (date: Date) => ({
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      }),
    },
  };
});

// Mock firebase config module to avoid env variance
vi.mock('../firebase', () => ({
  db: {},
}));

type JoinSessionFn = (pin: string) => Promise<JoinSessionResult>;

const joinSession = rawJoinSession as unknown as JoinSessionFn;

describe('session: joinSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns active session when pin exists and isActive=true', async () => {
    mocks.mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'sess-123',
          data: () => ({ pin: '1234', isActive: true }),
        },
      ],
    });

    const res = await joinSession('1234');
    expect(res.ok).toBe(true);
  });

  it('returns inactive when pin exists and isActive=false', async () => {
    mocks.mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'sess-123',
          data: () => ({ pin: '1234', isActive: false }),
        },
      ],
    });

    const res = await joinSession('1234');
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('inactive');
  });

  it('returns not-found when no matching active session', async () => {
    mocks.mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const res = await joinSession('9999');
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('not-found');
  });

  it('returns firestore-error when Firestore query throws', async () => {
    mocks.mockGetDocs.mockRejectedValue(Object.assign(new Error('boom'), { code: 'unknown' }));

    const res = await joinSession('0000');
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('firestore-error');
  });

  it.each([['123'], ['ABCD'], ['1Q2B'], [''], ['12345']])(
    'returns invalid-format when pin is not 4 digit number',
    async (input) => {
      const res = await joinSession(input);

      expect(res.ok).toBe(false);
      expect(res.errorCode).toBe('invalid-format');
    }
  );
});

describe('session: fetchLatestSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches hosted sessions with correct query', async () => {
    const mockHostedDocs = [
      {
        id: 'session-1',
        data: () => ({
          name: 'Hosted Session',
          hostId: 'user-123',
          hostDisplayName: 'Test User',
          isActive: true,
          pin: '1234',
          joinedBy: ['user-123'],
          createdAt: { seconds: 1706745600, nanoseconds: 0 },
        }),
      },
    ];

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: mockHostedDocs }); // Hosted query
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] }); // Joined query

    const result = await fetchLatestSessions('user-123');

    expect(mocks.mockWhere).toHaveBeenCalledWith('hostId', '==', 'user-123');
    expect(mocks.mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mocks.mockLimit).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
  });

  it('fetches joined sessions with correct query', async () => {
    const mockJoinedDocs = [
      {
        id: 'session-2',
        data: () => ({
          name: 'Joined Session',
          hostId: 'other-host',
          hostDisplayName: 'Other Host',
          isActive: true,
          pin: '5678',
          joinedBy: ['user-123', 'other-host'],
          createdAt: { seconds: 1706745500, nanoseconds: 0 },
        }),
      },
    ];

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] }); // Hosted query
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: mockJoinedDocs }); // Joined query

    const result = await fetchLatestSessions('user-123');

    expect(mocks.mockWhere).toHaveBeenCalledWith('joinedBy', 'array-contains', 'user-123');
    expect(result).toHaveLength(1);
  });

  it('merges and deduplicates hosted and joined sessions', async () => {
    const duplicateSession = {
      id: 'session-shared',
      data: () => ({
        name: 'Shared Session',
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: '1111',
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745600, nanoseconds: 0 },
      }),
    };

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [duplicateSession] }); // Hosted
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [duplicateSession] }); // Joined (same session)

    const result = await fetchLatestSessions('user-123');

    // Should deduplicate by ID
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('session-shared');
  });

  it('sorts sessions by createdAt descending (newest first)', async () => {
    const olderSession = {
      id: 'session-old',
      data: () => ({
        name: 'Old Session',
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: '1111',
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745400, nanoseconds: 0 },
      }),
    };

    const newerSession = {
      id: 'session-new',
      data: () => ({
        name: 'New Session',
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: '2222',
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745600, nanoseconds: 0 },
      }),
    };

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [olderSession, newerSession] });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('user-123');

    expect(result[0]?.id).toBe('session-new'); // Newer should be first
    expect(result[1]?.id).toBe('session-old');
  });

  it('sorts by nanoseconds when seconds are identical', async () => {
    const session1 = {
      id: 'session-1',
      data: () => ({
        name: 'Session 1',
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: '1111',
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745600, nanoseconds: 500000000 },
      }),
    };

    const session2 = {
      id: 'session-2',
      data: () => ({
        name: 'Session 2',
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: '2222',
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745600, nanoseconds: 800000000 },
      }),
    };

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [session1, session2] });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('user-123');

    // Session 2 has higher nanoseconds, should appear first
    expect(result[0]?.id).toBe('session-2');
    expect(result[1]?.id).toBe('session-1');
  });

  it('limits result to 3 sessions', async () => {
    const sessions = Array.from({ length: 5 }, (_, i) => ({
      id: `session-${i}`,
      data: () => ({
        name: `Session ${i}`,
        hostId: 'user-123',
        hostDisplayName: 'Test User',
        isActive: true,
        pin: `${1000 + i}`,
        joinedBy: ['user-123'],
        createdAt: { seconds: 1706745600 - i * 100, nanoseconds: 0 },
      }),
    }));

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: sessions });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('user-123');

    expect(result).toHaveLength(3);
  });

  it('limits to 3 when merging 6 distinct sessions', async () => {
    // Mock 3 hosted sessions
    const hostedSessions = [
      {
        id: 'session-h1',
        data: () => ({
          name: 'Hosted 1',
          hostId: 'user-123',
          hostDisplayName: 'Test User',
          isActive: true,
          pin: '0001',
          joinedBy: ['user-123'],
          createdAt: { seconds: 1706745600, nanoseconds: 0 },
        }),
      },
      {
        id: 'session-h2',
        data: () => ({
          name: 'Hosted 2',
          hostId: 'user-123',
          hostDisplayName: 'Test User',
          isActive: true,
          pin: '0002',
          joinedBy: ['user-123'],
          createdAt: { seconds: 1706745500, nanoseconds: 0 },
        }),
      },
      {
        id: 'session-h3',
        data: () => ({
          name: 'Hosted 3',
          hostId: 'user-123',
          hostDisplayName: 'Test User',
          isActive: true,
          pin: '0003',
          joinedBy: ['user-123'],
          createdAt: { seconds: 1706745400, nanoseconds: 0 },
        }),
      },
    ];

    // Mock 3 joined sessions (different IDs, older timestamps)
    const joinedSessions = [
      {
        id: 'session-j1',
        data: () => ({
          name: 'Joined 1',
          hostId: 'other-host',
          hostDisplayName: 'Other Host',
          isActive: true,
          pin: '0004',
          joinedBy: ['user-123', 'other-host'],
          createdAt: { seconds: 1706745300, nanoseconds: 0 },
        }),
      },
      {
        id: 'session-j2',
        data: () => ({
          name: 'Joined 2',
          hostId: 'other-host',
          hostDisplayName: 'Other Host',
          isActive: true,
          pin: '0005',
          joinedBy: ['user-123', 'other-host'],
          createdAt: { seconds: 1706745200, nanoseconds: 0 },
        }),
      },
      {
        id: 'session-j3',
        data: () => ({
          name: 'Joined 3',
          hostId: 'other-host',
          hostDisplayName: 'Other Host',
          isActive: true,
          pin: '0006',
          joinedBy: ['user-123', 'other-host'],
          createdAt: { seconds: 1706745100, nanoseconds: 0 },
        }),
      },
    ];

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: hostedSessions });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: joinedSessions });

    const result = await fetchLatestSessions('user-123');

    // Should limit to 3 newest sessions
    expect(result).toHaveLength(3);
    // The 3 hosted sessions are newest, so they should be returned
    expect(result[0]?.id).toBe('session-h1');
    expect(result[1]?.id).toBe('session-h2');
    expect(result[2]?.id).toBe('session-h3');
  });

  it('returns empty array when no sessions found', async () => {
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('user-123');

    expect(result).toEqual([]);
  });

  it('throws error on Firestore failure', async () => {
    mocks.mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    await expect(fetchLatestSessions('user-123')).rejects.toThrow('Firestore error');
  });

  it('maps Firestore documents to Session objects correctly', async () => {
    const mockDoc = {
      id: 'session-123',
      data: () => ({
        name: 'Test Session',
        hostId: 'host-456',
        hostDisplayName: 'Host Name',
        isActive: true,
        pin: '9876',
        joinedBy: ['host-456', 'guest-789'],
        createdAt: { seconds: 1706745600, nanoseconds: 0 },
      }),
    };

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [mockDoc] });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('host-456');

    expect(result[0]).toEqual({
      id: 'session-123',
      name: 'Test Session',
      hostId: 'host-456',
      hostDisplayName: 'Host Name',
      isActive: true,
      pin: '9876',
      joinedBy: ['host-456', 'guest-789'],
      createdAt: { seconds: 1706745600, nanoseconds: 0 },
    });
  });

  it('handles missing joinedBy field gracefully', async () => {
    const mockDoc = {
      id: 'session-no-joined',
      data: () => ({
        name: 'Session Without JoinedBy',
        hostId: 'host-123',
        hostDisplayName: 'Host Name',
        isActive: true,
        pin: '5555',
        // joinedBy field is intentionally omitted
        createdAt: { seconds: 1706745600, nanoseconds: 0 },
      }),
    };

    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [mockDoc] });
    mocks.mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await fetchLatestSessions('host-123');

    // Should default to empty array when joinedBy is missing
    expect(result[0]).toBeDefined();
    expect(result[0]?.joinedBy).toEqual([]);
  });
});

describe('session: createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates session with required fields', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);
    mocks.mockCollection.mockReturnValue({});

    const input = {
      name: 'New Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    const result = await createSession(input);

    expect(mocks.mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'New Session',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
        isActive: true,
        joinedBy: ['host-123'],
        pin: expect.stringMatching(/^\d{4}$/),
        createdAt: expect.anything(),
      })
    );

    expect(result.id).toBe('new-session-id');
  });

  it('generates 4-digit PIN automatically', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);

    const input = {
      name: 'New Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    await createSession(input);

    const addDocCall = mocks.mockAddDoc.mock.calls[0];
    const sessionData = addDocCall?.[1];

    expect(sessionData).toHaveProperty('pin');
    expect(sessionData.pin).toMatch(/^\d{4}$/);
  });

  it('sets createdAt timestamp', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);

    const input = {
      name: 'New Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    await createSession(input);

    const addDocCall = mocks.mockAddDoc.mock.calls[0];
    const sessionData = addDocCall?.[1];

    expect(sessionData).toHaveProperty('createdAt');
    expect(sessionData.createdAt).toBeDefined();
  });

  it('initializes joinedBy with hostId', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);

    const input = {
      name: 'New Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    await createSession(input);

    const addDocCall = mocks.mockAddDoc.mock.calls[0];
    const sessionData = addDocCall?.[1];

    expect(sessionData.joinedBy).toEqual(['host-123']);
  });

  it('sets isActive to true by default', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);

    const input = {
      name: 'New Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    await createSession(input);

    const addDocCall = mocks.mockAddDoc.mock.calls[0];
    const sessionData = addDocCall?.[1];

    expect(sessionData.isActive).toBe(true);
  });

  it('returns complete Session object', async () => {
    const mockSessionRef = { id: 'new-session-id' };
    mocks.mockAddDoc.mockResolvedValue(mockSessionRef);

    const input = {
      name: 'Complete Session',
      hostId: 'host-999',
      hostDisplayName: 'Complete Host',
    };

    const result = await createSession(input);

    expect(result).toMatchObject({
      id: 'new-session-id',
      name: 'Complete Session',
      hostId: 'host-999',
      hostDisplayName: 'Complete Host',
      isActive: true,
    });

    expect(result.pin).toMatch(/^\d{4}$/);
    expect(result.joinedBy).toEqual(['host-999']);
    expect(result.createdAt).toBeDefined();
  });

  it('throws error on Firestore failure', async () => {
    mocks.mockAddDoc.mockRejectedValue(new Error('Firestore write error'));

    const input = {
      name: 'Failed Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    await expect(createSession(input)).rejects.toThrow('Firestore write error');
  });

  it('generates unique PINs for different sessions', async () => {
    const pins = new Set<string>();

    mocks.mockAddDoc.mockImplementation((_, data) => {
      pins.add(data.pin);
      return Promise.resolve({ id: `session-${pins.size}` });
    });

    const input = {
      name: 'Session',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
    };

    // Create multiple sessions
    for (let i = 0; i < 10; i++) {
      await createSession(input);
    }

    // Should generate different PINs (statistically very likely)
    expect(pins.size).toBeGreaterThan(1);
  });
});
