import { onAuthStateChanged, type Unsubscribe, type User } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signOut as signOutService } from '../lib/authService';

type AuthState = {
  user: User | null;
  isAuthReady: boolean;
};

/**
 * App-wide auth state fed by a single Firebase Auth subscription.
 * Exported so non-React code (route loaders, tests) can read it via `getState()`.
 */
export const useAuthStore = create<AuthState>()(() => ({
  user: null,
  isAuthReady: false,
}));

let unsubscribe: Unsubscribe | null = null;
let resolveAuthReady: (() => void) | null = null;
let authReadyPromise: Promise<void> | null = null;

/**
 * Starts the Firebase listener on first use; later calls reuse it.
 * Tests can mock onAuthStateChanged to control auth flow without Firebase interaction.
 */
function ensureSubscribed() {
  if (unsubscribe != null) return;

  unsubscribe = onAuthStateChanged(auth, (u) => {
    useAuthStore.setState({ user: u ?? null });

    if (!useAuthStore.getState().isAuthReady) {
      useAuthStore.setState({ isAuthReady: true });
      resolveAuthReady?.();
      resolveAuthReady = null;
    }
  });
}

export function waitForAuthReady(): Promise<void> {
  ensureSubscribed();

  if (useAuthStore.getState().isAuthReady) {
    return Promise.resolve();
  }

  authReadyPromise ??= new Promise<void>((resolve) => {
    resolveAuthReady = resolve;
  });

  return authReadyPromise;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().user != null;
}

/**
 * Guests are anonymous auth users (or nobody signed in) who got in through a PIN or
 * session link. They cannot create songs or sessions, only join a specific active session.
 */
const isGuestUser = (user: User | null) => user == null || user.isAnonymous;

/** Signs out and clears local auth state; the next useAuth() call subscribes again. */
export async function logout() {
  unsubscribe?.();
  unsubscribe = null;
  await signOutService();
  useAuthStore.setState({ user: null });
}

/** Reactive auth state for components. Route loaders use `waitForAuthReady` / `isAuthenticated`. */
export function useAuth() {
  ensureSubscribed();

  const user = useAuthStore((state) => state.user);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);

  return {
    user,
    isAuthenticated: user != null,
    isAuthReady,
    isGuest: isGuestUser(user),
    waitForAuthReady,
    logout,
  };
}
