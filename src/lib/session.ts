import { collection, query, where, getDocs, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Session data model
 *
 * Sessions are documents in the 'sessions' Firestore collection.
 * The PIN must be 4 digits. Guests query by PIN to find and join active sessions.
 * Security Rules restrict guest access to active sessions only.
 */
type Session = {
  pin: string;
  isActive: boolean;
  hostId: string;
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
export interface JoinSessionResult {
  ok: boolean;
  errorCode?: 'not-found' | 'inactive' | 'firestore-error' | 'invalid-format';
}

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

/**
 * Attempts to join a session using the provided PIN.
 *
 * Performs client-side Firestore query to find active session with matching PIN.
 * Security Rules must allow guests to read from 'sessions' collection
 * (specifically active sessions with matching PIN).
 *
 * @param pin - The session PIN to join (should be 4 digits)
 * @returns Promise resolving to JoinSessionResult with ok=true on success,
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
export const joinSession = async (pin: string): Promise<JoinSessionResult> => {
  // Fail fast on invalid PIN format without hitting Firestore
  if (isPinInvalid(pin) === true) return { ok: false, errorCode: 'invalid-format' };

  // Query sessions collection for exact PIN match
  // Note: No isActive filter here; we check manually to provide specific error code
  const q = query(collection(db, 'sessions'), where('pin', '==', pin));

  return getDocs(q)
    .then((s) => {
      // Convert query result to typed Session objects
      const sessions: Session[] = s.docs.map((d) => {
        const data = d.data() as DocumentData;
        return { pin: data.pin, isActive: data.isActive, hostId: data.hostId };
      });

      // No matching session found with this PIN
      if (sessions.length === 0) {
        return { ok: false, errorCode: 'not-found' } as JoinSessionResult;
      }

      // Session exists but is inactive (closed or ended)
      if (sessions[0]?.isActive === false) {
        return { ok: false, errorCode: 'inactive' } as JoinSessionResult;
      }

      // Success! Session is active and accepting joins
      return { ok: true };
    })
    .catch(() => {
      // Any Firestore error (permission denied, network issue, etc.)
      return { ok: false, errorCode: 'firestore-error' };
    });
};
