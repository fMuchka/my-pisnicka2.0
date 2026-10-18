import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStatusResult } from '../../lib/session';
import { createSessionStore, selectActiveSessionRoute } from '../session';

const mocks = vi.hoisted(() => ({
  getSessionStatus: vi.fn<(pin: string) => Promise<SessionStatusResult>>(),
}));

vi.mock('../../lib/session', () => ({ getSessionStatus: mocks.getSessionStatus }));

const STORAGE_KEY = 'my-pisnicka:session';
const details = { id: 's1', hostId: 'h1', pin: '1234', isActive: true };

const sessionLookup = (overrides: Partial<typeof details> = {}) =>
  ({ ...details, ...overrides }) as unknown as NonNullable<SessionStatusResult['session']>;

describe('session store', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.getSessionStatus.mockReset();
    mocks.getSessionStatus.mockResolvedValue({ ok: true, session: sessionLookup() });
  });

  it('saves the session to sessionStorage and clears it again', () => {
    const store = createSessionStore();

    store.getState().setSessionDetails(details);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(details);

    store.getState().clearSession();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not query Firestore when nothing was saved', async () => {
    await createSessionStore().getState().whenValidated();

    expect(mocks.getSessionStatus).not.toHaveBeenCalled();
  });

  it('restores a saved session that is still active', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(details));

    const store = createSessionStore();
    await store.getState().whenValidated();

    expect(mocks.getSessionStatus).toHaveBeenCalledWith('1234');
    expect(store.getState().sessionDetails).toEqual(details);
    expect(selectActiveSessionRoute(store.getState())).toBe(
      '/session?sessionId=s1&hostId=h1&pin=1234'
    );
  });

  it('drops a saved session the host has closed', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    mocks.getSessionStatus.mockResolvedValue({ ok: false, errorCode: 'inactive' });

    const store = createSessionStore();
    await store.getState().whenValidated();

    expect(store.getState().sessionDetails).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('drops a saved session whose PIN now belongs to a different session', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    mocks.getSessionStatus.mockResolvedValue({ ok: true, session: sessionLookup({ id: 's2' }) });

    const store = createSessionStore();
    await store.getState().whenValidated();

    expect(store.getState().sessionDetails).toBeNull();
  });

  it('keeps the saved session when Firestore is unreachable', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    mocks.getSessionStatus.mockResolvedValue({ ok: false, errorCode: 'firestore-error' });

    const store = createSessionStore();
    await store.getState().whenValidated();

    expect(store.getState().sessionDetails).toEqual(details);
  });

  it('keeps a session joined while the recheck was running', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    mocks.getSessionStatus.mockResolvedValue({ ok: false, errorCode: 'inactive' });

    const store = createSessionStore();
    const joined = { id: 's9', hostId: 'h9', pin: '9999', isActive: true };
    store.getState().setSessionDetails(joined);
    await store.getState().whenValidated();

    expect(store.getState().sessionDetails).toEqual(joined);
  });

  it('ignores malformed saved data', async () => {
    sessionStorage.setItem(STORAGE_KEY, '{"id": 5}');

    const store = createSessionStore();
    await store.getState().whenValidated();

    expect(store.getState().sessionDetails).toBeNull();
    expect(mocks.getSessionStatus).not.toHaveBeenCalled();
  });

  it('has no session route once the session is closed', () => {
    const store = createSessionStore();
    store.getState().setSessionDetails({ ...details, isActive: false });

    expect(selectActiveSessionRoute(store.getState())).toBeNull();
  });
});
