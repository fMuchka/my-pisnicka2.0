import { collection, query, where, getDocs, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';

type Session = {
  pin: string;
  isActive: boolean;
  hostId: string;
};

export interface JoinSessionResult {
  ok: boolean;
  errorCode?: 'not-found' | 'inactive' | 'firestore-error' | 'invalid-format';
}

/**
 * Attempts to join a session using the provided PIN.
 *
 * @param pin - The session PIN to join
 * @returns A promise that resolves to a JoinSessionResult object containing:
 *   - `ok: true` if the session was found and is active
 *   - `ok: false` with `errorCode: 'not-found'` if no session exists with the given PIN
 *   - `ok: false` with `errorCode: 'inactive'` if the session exists but is not active
 *   - `ok: false` with `errorCode: 'firestore-error'` if a Firestore error occurs
 *   - `ok: false` with `errorCode: 'invalid-format'` pin format is not valid
 *
 * @example
 * ```typescript
 * const result = await joinSession('1234');
 * if (result.ok) {
 *   console.log('Successfully joined session');
 * } else {
 *   console.error(`Failed to join: ${result.errorCode}`);
 * }
 * ```
 */
export const joinSession = async (pin: string): Promise<JoinSessionResult> => {
  if (isPinInvalid(pin) === true) return { ok: false, errorCode: 'invalid-format' };
  const q = query(collection(db, 'sessions'), where('pin', '==', pin));

  return getDocs(q)
    .then((s) => {
      const sessions: Session[] = s.docs.map((d) => {
        const data = d.data() as DocumentData;
        return { pin: data.pin, isActive: data.isActive, hostId: data.hostId };
      });

      if (sessions.length === 0) {
        return { ok: false, errorCode: 'not-found' } as JoinSessionResult;
      }

      if (sessions[0]?.isActive === false) {
        return { ok: false, errorCode: 'inactive' } as JoinSessionResult;
      }

      return { ok: true };
    })
    .catch(() => {
      return { ok: false, errorCode: 'firestore-error' };
    });
};

const isPinInvalid = (pin: string): boolean => {
  return !/^\d{4}$/.test(pin);
};
