import { create } from 'zustand';
import { getSessionStatus, type Session, type SessionRouterQuery } from '../lib/session';
import Routes from '../router/Routes';

export type SessionStoreDetails = Pick<Session, 'id' | 'hostId' | 'pin'> &
  Partial<Pick<Session, 'name' | 'hostDisplayName' | 'isActive'>>;

const SESSION_STORAGE_KEY = 'my-pisnicka:session';

const isSessionStoreDetails = (value: unknown): value is SessionStoreDetails => {
  if (typeof value !== 'object' || value === null) return false;

  const { id, hostId, pin } = value as Record<string, unknown>;
  return typeof id === 'string' && typeof hostId === 'string' && typeof pin === 'string';
};

// Storage can be blocked (private mode, disabled site data); the session then just lives in memory.
const readStoredSession = (): SessionStoreDetails | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSessionStoreDetails(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredSession = (details: SessionStoreDetails | null) => {
  try {
    if (details) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(details));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // See readStoredSession.
  }
};

export type SessionState = {
  sessionDetails: SessionStoreDetails | null;
  /** Resolves once a session restored from storage has been rechecked against Firestore. */
  whenValidated: () => Promise<void>;
  setSessionFromModel: (session: Session) => void;
  setSessionDetails: (details: SessionStoreDetails) => void;
  clearSession: () => void;
};

export const selectHasSession = (state: SessionState) => state.sessionDetails !== null;

// Set only after the PIN/link was checked against Firestore (Join or Session page).
export const selectHasActiveSession = (state: SessionState) =>
  state.sessionDetails !== null && state.sessionDetails.isActive !== false;

// A string rather than a location object: Zustand selectors must return stable values.
export const selectActiveSessionRoute = (state: SessionState): string | null => {
  const details = state.sessionDetails;

  if (!selectHasActiveSession(state) || details == null) {
    return null;
  }

  const query: SessionRouterQuery = {
    sessionId: details.id,
    hostId: details.hostId,
    pin: details.pin,
  };

  return `${Routes.Session}?${new URLSearchParams(query).toString()}`;
};

/** Exported for tests, which need a fresh store per case; the app uses `useSessionStore`. */
export const createSessionStore = () => {
  // Kept in sessionStorage so a reload doesn't kick a PIN guest out of guest-allowed pages.
  const restoredSession = readStoredSession();

  const store = create<SessionState>()((set) => ({
    sessionDetails: restoredSession,
    whenValidated: () => validation,

    setSessionFromModel: (session) =>
      set({
        sessionDetails: {
          id: session.id,
          hostId: session.hostId,
          pin: session.pin,
          name: session.name,
          hostDisplayName: session.hostDisplayName,
          isActive: session.isActive,
        },
      }),

    setSessionDetails: (details) => set({ sessionDetails: { ...details } }),

    clearSession: () => set({ sessionDetails: null }),
  }));

  store.subscribe((state, previous) => {
    if (state.sessionDetails !== previous.sessionDetails) {
      writeStoredSession(state.sessionDetails);
    }
  });

  // The host may have closed the session since it was saved, so recheck it once per app load.
  const revalidateRestoredSession = async (restored: SessionStoreDetails) => {
    const status = await getSessionStatus(restored.pin);

    // Network/permission errors keep the saved session, so an offline reload still works.
    if (status.errorCode === 'firestore-error') return;

    const isSameSession =
      status.ok && status.session?.id === restored.id && status.session.hostId === restored.hostId;

    // Leave it alone if the user joined another session while the check was running.
    if (!isSameSession && store.getState().sessionDetails?.id === restored.id) {
      store.getState().clearSession();
    }
  };

  const validation = restoredSession
    ? revalidateRestoredSession(restoredSession)
    : Promise.resolve();

  return store;
};

export const useSessionStore = createSessionStore();
