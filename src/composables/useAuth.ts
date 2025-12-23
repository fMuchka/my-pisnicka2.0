import { ref, computed } from 'vue';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { signOut as signOutService } from '../lib/authService';

// Shared auth state
const user = ref<User | null>(null);

// Subscribe to Firebase auth changes on each use for simplicity/testing
function subscribe() {
  return onAuthStateChanged(auth, (u) => {
    user.value = u ?? null;
  });
}

export function useAuth() {
  // Start listener (tests mock onAuthStateChanged)
  subscribe();

  const isAuthenticated = computed(() => user.value != null);

  const isHost = computed(() => {
    const email = user.value?.email ?? '';
    return email.includes('@host');
  });

  const isGuest = computed(() => {
    if (!user.value) return false;
    if (user.value.isAnonymous) return true;
    return (user.value.providerData ?? []).some((p) => p?.providerId === 'emailLink');
  });

  const logout = async () => {
    await signOutService();
    user.value = null;
  };

  return {
    user,
    isAuthenticated,
    isHost,
    isGuest,
    logout,
  };
}
