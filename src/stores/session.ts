import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
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

export const useSessionStore = defineStore('session', () => {
  // Kept in sessionStorage so a reload doesn't kick a PIN guest out of guest-allowed pages.
  const restoredSession = readStoredSession();
  const sessionDetails = ref<SessionStoreDetails | null>(restoredSession);

  watch(sessionDetails, writeStoredSession, { deep: true });

  // The host may have closed the session since it was saved, so recheck it once per app load.
  const revalidateRestoredSession = async (restored: SessionStoreDetails) => {
    const status = await getSessionStatus(restored.pin);

    // Network/permission errors keep the saved session, so an offline reload still works.
    if (status.errorCode === 'firestore-error') return;

    const isSameSession =
      status.ok && status.session?.id === restored.id && status.session.hostId === restored.hostId;

    // Leave it alone if the user joined another session while the check was running.
    if (!isSameSession && sessionDetails.value?.id === restored.id) {
      sessionDetails.value = null;
    }
  };

  const validation = restoredSession
    ? revalidateRestoredSession(restoredSession)
    : Promise.resolve();

  /** Resolves once a session restored from storage has been rechecked against Firestore. */
  const whenValidated = () => validation;

  const hasSession = computed(() => {
    return sessionDetails.value !== null;
  });

  // Set only after the PIN/link was checked against Firestore (Join or Session page).
  const hasActiveSession = computed(() => {
    return sessionDetails.value !== null && sessionDetails.value.isActive !== false;
  });

  const activeSessionRoute = computed(() => {
    const details = sessionDetails.value;

    if (!hasActiveSession.value || details == null) {
      return null;
    }

    const query: SessionRouterQuery = {
      sessionId: details.id,
      hostId: details.hostId,
      pin: details.pin,
    };

    return { path: Routes.Session, query };
  });

  const setSessionFromModel = (session: Session) => {
    sessionDetails.value = {
      id: session.id,
      hostId: session.hostId,
      pin: session.pin,
      name: session.name,
      hostDisplayName: session.hostDisplayName,
      isActive: session.isActive,
    };
  };

  const setSessionDetails = (details: SessionStoreDetails) => {
    sessionDetails.value = { ...details };
  };

  const clearSession = () => {
    sessionDetails.value = null;
  };

  return {
    sessionDetails,
    hasSession,
    hasActiveSession,
    activeSessionRoute,
    whenValidated,
    setSessionFromModel,
    setSessionDetails,
    clearSession,
  };
});
