import { ref, computed } from 'vue';
import { onAuthStateChanged, type Unsubscribe, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { signOut as signOutService } from '../lib/authService';

/**
 * Module-level auth state shared across all useAuth() consumers.
 * Using a ref at module level ensures all components receive auth updates
 * through a single subscription to Firebase Auth state changes.
 */
const user = ref<User | null>(null);
const unsubscribe = ref<Unsubscribe | null>(null);

/**
 * Subscribe to Firebase Auth state changes.
 * Returns unsubscribe function but maintains subscription for lifetime of app
 * (singleton pattern suitable for auth state that should never be unsubscribed).
 *
 * Tests can mock onAuthStateChanged to control auth flow without Firebase interaction.
 */
function subscribe() {
  return onAuthStateChanged(auth, (u) => {
    user.value = u ?? null;
  });
}

/**
 * Composable for accessing reactive authentication state.
 *
 * IMPORTANT: Must be called inside component setup or route guards for fresh
 * state on each navigation. Router guards in particular should call useAuth()
 * inside beforeEach, not at module level.
 *
 * Returns:
 * - user: ref<User | null> - Current authenticated user or null
 * - isAuthenticated: computed<boolean> - True if user is logged in
 * - isGuest: computed<boolean> - True if anonymous or emailLink provider
 * - logout(): async - Sign out and clear local auth state
 *
 * @example
 * ```typescript
 * // In a route guard
 * router.beforeEach((to, from, next) => {
 *   const { isAuthenticated } = useAuth(); // Fresh check each navigation
 *   if (!isAuthenticated.value && to.path === '/protected') next('/login');
 *   else next();
 * });
 * ```
 */
export function useAuth() {
  // Establish listener on first use (subsequent calls reuse same subscription)
  if (unsubscribe.value == null) {
    unsubscribe.value = subscribe();
  }

  const isAuthenticated = computed(() => user.value != null);

  /**
   * Guests can are Anonymous auth users
   * who got in through PIN or Session link
   *
   * These users cannot create songs or sessions.
   * They can only get invited into a specific Active Session.
   */
  const isGuest = computed(() => {
    if (user.value == null) return true;
    if (user.value.isAnonymous) return true;

    if (user.value != null) return false;
    return true;
  });

  /**
   * Signs out current user and clears local auth state.
   * Calls authService.signOut which delegates to Firebase Auth.
   */
  const logout = async () => {
    unsubscribe.value?.();
    await signOutService();
    user.value = null;
    unsubscribe.value = null;
  };

  return {
    user,
    isAuthenticated,
    isGuest,
    logout,
  };
}
