import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Auth Service Module
 *
 * Wraps Firebase Auth SDK methods to provide a clean service layer.
 * Allows tests to mock this module instead of the entire Firebase SDK.
 * Keeps Firebase imports localized to this file for easier maintenance.
 */

/**
 * Signs in a user with email and password.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to the User object on success
 * @throws Firebase Auth error if credentials are invalid or user doesn't exist
 */
export async function loginWithEmailPassword(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Signs out the currently authenticated user.
 *
 * Clears all auth tokens from the browser's auth state.
 * After this completes, useAuth().user will become null.
 *
 * @throws Firebase error if signout fails (rare in practice)
 */
export async function signOut() {
  await firebaseSignOut(auth);
}
