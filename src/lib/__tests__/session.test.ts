import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getDocs } from 'firebase/firestore';
import { joinSession as rawJoinSession, type JoinSessionResult } from '../session';

// Mock Firestore SDK used by joinSession implementation
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn((db: unknown, path: string) => ({ db, path })),
    where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
    query: vi.fn((colRef: unknown, ...clauses: unknown[]) => ({ colRef, clauses })),
    getDocs: vi.fn(),
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
    const mockedGetDocs = getDocs as Mock;
    mockedGetDocs.mockResolvedValue({
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
    const mockedGetDocs = getDocs as Mock;
    mockedGetDocs.mockResolvedValue({
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
    const mockedGetDocs = getDocs as Mock;
    mockedGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const res = await joinSession('9999');
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('not-found');
  });

  it('returns firestore-error when Firestore query throws', async () => {
    const mockedGetDocs = getDocs as Mock;
    mockedGetDocs.mockRejectedValue(Object.assign(new Error('boom'), { code: 'unknown' }));

    const res = await joinSession('0000');
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('firestore-error');
  });

  it.each([['123'], ['ABCD'], ['1Q2B']])(
    'returns invalid-format when pin is not 4 digit number',
    async (input) => {
      const res = await joinSession(input);

      expect(res.ok).toBe(false);
      expect(res.errorCode).toBe('invalid-format');
    }
  );
});
