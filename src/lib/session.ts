import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Session data model
 *
 * Sessions are documents in the 'sessions' Firestore collection.
 * The PIN must be 4 digits. Guests query by PIN to find and join active sessions.
 * Security Rules restrict guest access to active sessions only.
 */
export type Session = {
  id: string;
  name: string;
  hostId: string;
  hostDisplayName: string;
  isActive: boolean;
  pin: string;
  joinedBy: string[];
  createdAt: Timestamp;
  activeSongId?: string;
};

export type SessionRouterQuery = {
  sessionId: string;
  hostId: string;
  pin: string;
};

export type SessionErrorCode = 'not-found' | 'inactive' | 'firestore-error' | 'invalid-format';

type SessionLookup = Pick<Session, 'pin' | 'isActive' | 'hostId'>;

export type CreateSessionInput = {
  name: string;
  hostId: string;
  hostDisplayName: string;
};

/**
 * Result type for session join operations.
 *
 * Provides detailed error codes to allow UI to display localized error messages:
 * - 'not-found': No session exists with the given PIN
 * - 'inactive': Session exists but is closed (isActive: false)
 * - 'firestore-error': Network or permission error
 * - 'invalid-format': PIN doesn't match 4-digit format
 */
export interface SessionStatusResult {
  ok: boolean;
  session?: Session;
  errorCode?: SessionErrorCode;
}

export interface OkSessionResult extends SessionStatusResult {
  ok: true;
  session: Session;
}

const SESSION_ERROR_MESSAGES_CS: Record<SessionErrorCode, string> = {
  'not-found': 'Relace s tímto PINem neexistuje.',
  inactive: 'Relace je uzavřena nebo již skončila.',
  'invalid-format': 'PIN musí být 4-místné číslo.',
  'firestore-error':
    'Chyba připojení. Zkus to prosím později nebo se ujisti, že máš přístup k internetu.',
};

export const getSessionErrorMessage = (errorCode?: SessionErrorCode): string => {
  if (!errorCode) {
    return '';
  }

  return SESSION_ERROR_MESSAGES_CS[errorCode] ?? 'Neznámá chyba';
};

/**
 * Validates 4-digit PIN format.
 * Returns true if invalid (double negative for clarity in if statements).
 *
 * @param pin - The PIN string to validate
 * @returns true if PIN does not match 4-digit pattern
 */
const isPinInvalid = (pin: string): boolean => {
  return !/^\d{4}$/.test(pin);
};

const MAX_PIN_GENERATION_ATTEMPTS = 30;
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const generatePin = (): string => {
  const value = Math.floor(Math.random() * 10000);
  return String(value).padStart(4, '0');
};

const isActivePinTaken = async (pin: string): Promise<boolean> => {
  const pinQuery = query(
    collection(db, 'sessions'),
    where('pin', '==', pin),
    where('isActive', '==', true),
    limit(1)
  );
  const snapshot = await getDocs(pinQuery);

  return snapshot.docs.length > 0;
};

const generateAvailablePin = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_PIN_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generatePin();
    const taken = await isActivePinTaken(candidate);

    if (taken === false) {
      return candidate;
    }
  }

  throw new Error('Unable to allocate a unique session PIN. Please retry.');
};

const mapSessionDoc = (doc: { id: string; data: () => DocumentData }): Session => {
  const data = doc.data() as DocumentData;
  return {
    id: doc.id,
    name: data.name,
    hostId: data.hostId,
    hostDisplayName: data.hostDisplayName,
    isActive: data.isActive,
    pin: data.pin,
    joinedBy: data.joinedBy ?? [],
    createdAt: data.createdAt,
  } as Session;
};

const toTimestampMs = (timestamp: Timestamp): number => {
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);
};

const isSessionExpired = (session: Session, nowMs: number): boolean => {
  return nowMs - toTimestampMs(session.createdAt) > SESSION_MAX_AGE_MS;
};

/**
 * Attempts to join a session using the provided PIN.
 *
 * Performs client-side Firestore query to find active session with matching PIN.
 * Security Rules must allow guests to read from 'sessions' collection
 * (specifically active sessions with matching PIN).
 *
 * @param pin - The session PIN to join (should be 4 digits)
 * @returns Promise resolving to SessionStatusResult with ok=true on success,
 *          or ok=false with specific errorCode on failure
 *
 * @example
 * ```typescript
 * const result = await joinSession('1234');
 * if (result.ok) {
 *   console.log('Successfully joined session');
 * } else {
 *   console.error(`Failed: ${result.errorCode}`);
 * }
 * ```
 *
 * Error Scenarios:
 * - 'invalid-format': PIN doesn't match 4-digit requirement (fail fast, no Firestore query)
 * - 'not-found': Query returned no documents (session doesn't exist)
 * - 'inactive': Session found but isActive field is false
 * - 'firestore-error': Catch-all for Firestore exceptions (permission denied, network error, etc.)
 */
export const getSessionStatus = async (pin: string): Promise<SessionStatusResult> => {
  // Fail fast on invalid PIN format without hitting Firestore
  if (isPinInvalid(pin) === true) return { ok: false, errorCode: 'invalid-format' };

  // Query sessions collection for exact PIN match
  // Note: No isActive filter here; we check manually to provide specific error code
  // limit(1) is required for unauthenticated guest access per Firestore security rules
  const q = query(collection(db, 'sessions'), where('pin', '==', pin), limit(1));

  return getDocs(q)
    .then((s) => {
      // Convert query result to typed Session objects
      const sessions: SessionLookup[] = s.docs.map((d) => {
        const data = d.data() as DocumentData;
        return { pin: data.pin, isActive: data.isActive, hostId: data.hostId, id: d.id };
      });

      // No matching session found with this PIN
      if (sessions.length === 0) {
        return { ok: false, errorCode: 'not-found' } as SessionStatusResult;
      }

      // Session exists but is inactive (closed or ended)
      if (sessions[0]?.isActive === false) {
        return { ok: false, errorCode: 'inactive' } as SessionStatusResult;
      }

      // Success! Session is active and accepting joins
      return { ok: true, session: sessions[0] as Session };
    })
    .catch(() => {
      // Any Firestore error (permission denied, network issue, etc.)
      return { ok: false, errorCode: 'firestore-error' };
    });
};

/**
 * Fetches the latest sessions for a user (hosted or joined), sorted by newest first.
 */
export const fetchLatestSessions = async (userId: string): Promise<Session[]> => {
  const baseQuery = collection(db, 'sessions');
  const hostedQuery = query(
    baseQuery,
    where('hostId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(3)
  );
  const joinedQuery = query(
    baseQuery,
    where('joinedBy', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(3)
  );

  const [hostedSnapshot, joinedSnapshot] = await Promise.all([
    getDocs(hostedQuery),
    getDocs(joinedQuery),
  ]);

  const merged = new Map<string, Session>();
  hostedSnapshot.docs.forEach((doc) => merged.set(doc.id, mapSessionDoc(doc)));
  joinedSnapshot.docs.forEach((doc) => merged.set(doc.id, mapSessionDoc(doc)));

  const nowMs = toTimestampMs(Timestamp.now());
  const expiredSessions = Array.from(merged.values()).filter(
    (session) => session.isActive === true && isSessionExpired(session, nowMs)
  );

  if (expiredSessions.length > 0) {
    await Promise.all(
      expiredSessions.map(async (session) => {
        const sessionRef = doc(db, 'sessions', session.id);
        await updateDoc(sessionRef, { isActive: false });
        session.isActive = false;
      })
    );
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (a.createdAt.seconds !== b.createdAt.seconds) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return b.createdAt.nanoseconds - a.createdAt.nanoseconds;
    })
    .slice(0, 3);
};

/**
 * Fetches all sessions for a user (hosted or joined), without a limit, sorted by newest first.
 * Used for the full session list page.
 */
export const fetchAllUserSessions = async (userId: string): Promise<Session[]> => {
  const baseQuery = collection(db, 'sessions');
  const hostedQuery = query(baseQuery, where('hostId', '==', userId), orderBy('createdAt', 'desc'));
  const joinedQuery = query(
    baseQuery,
    where('joinedBy', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  const [hostedSnapshot, joinedSnapshot] = await Promise.all([
    getDocs(hostedQuery),
    getDocs(joinedQuery),
  ]);

  const merged = new Map<string, Session>();
  hostedSnapshot.docs.forEach((d) => merged.set(d.id, mapSessionDoc(d)));
  joinedSnapshot.docs.forEach((d) => merged.set(d.id, mapSessionDoc(d)));

  const nowMs = toTimestampMs(Timestamp.now());
  const expiredSessions = Array.from(merged.values()).filter(
    (session) => session.isActive === true && isSessionExpired(session, nowMs)
  );

  if (expiredSessions.length > 0) {
    await Promise.all(
      expiredSessions.map(async (session) => {
        const sessionRef = doc(db, 'sessions', session.id);
        await updateDoc(sessionRef, { isActive: false });
        session.isActive = false;
      })
    );
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.createdAt.seconds !== b.createdAt.seconds) {
      return b.createdAt.seconds - a.createdAt.seconds;
    }
    return b.createdAt.nanoseconds - a.createdAt.nanoseconds;
  });
};

/**
 * Deletes all closed sessions hosted by the given user.
 *
 * Only host-owned closed sessions are deleted to align with Firestore write restrictions.
 * Returns deleted document IDs so the UI can update local state without a full reload.
 */
export const deleteClosedHostedSessions = async (userId: string): Promise<string[]> => {
  const closedSessionsQuery = query(
    collection(db, 'sessions'),
    where('hostId', '==', userId),
    where('isActive', '==', false)
  );

  const snapshot = await getDocs(closedSessionsQuery);
  const deletedIds = snapshot.docs.map((sessionDoc) => sessionDoc.id);

  if (deletedIds.length === 0) {
    return [];
  }

  await Promise.all(
    snapshot.docs.map((sessionDoc) => deleteDoc(doc(db, 'sessions', sessionDoc.id)))
  );

  return deletedIds;
};

/**
 * Creates a new active session with a generated 4-digit PIN.
 */
export const createSession = async (input: CreateSessionInput): Promise<Session> => {
  const pin = await generateAvailablePin();

  const sessionData = {
    name: input.name,
    hostId: input.hostId,
    hostDisplayName: input.hostDisplayName,
    isActive: true,
    pin,
    joinedBy: [input.hostId],
    createdAt: Timestamp.now(),
  };

  const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);

  return {
    id: sessionRef.id,
    ...sessionData,
  };
};

export const createSessionRouterQuery = (session: Session, owner?: string): SessionRouterQuery => {
  return {
    sessionId: session.id,
    hostId: owner ?? session.hostId,
    pin: session.pin,
  };
};

export const updateActiveSongId = async (songId: string, sessionId: string): Promise<void> => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, { activeSongId: songId });
};

export const fetchActiveSongId = async (sessionId: string): Promise<string | null> => {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) return null;
  const activeSongId: unknown = snapshot.data()['activeSongId'];
  if (typeof activeSongId === 'string' && activeSongId.length > 0) return activeSongId;
  return null;
};
