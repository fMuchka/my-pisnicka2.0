import { createRouter, createWebHistory } from 'vue-router';
import Routes from './Routes';
import { useAuth } from '../composables/useAuth';
import { useSessionStore } from '../stores/session';

/**
 * Router Configuration
 *
 * Defines all application routes and sets up auth guard for protected pages.
 * Uses lazy-loaded page components to optimize bundle size.
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: Routes.Home, component: () => import('../pages/Home.vue') },
    { path: Routes.Login, component: () => import('../pages/Login.vue') },
    { path: Routes.Info, component: () => import('../pages/Info.vue') },
    { path: Routes.Settings, component: () => import('../pages/Settings.vue') },
    { path: Routes.Join, component: () => import('../pages/Join.vue') },
    { path: Routes.SongLibrary, component: () => import('../pages/SongLibrary.vue') },
    { path: Routes.SongCreate, component: () => import('../pages/Song.vue') },
    { path: Routes.Song, component: () => import('../pages/Song.vue') },
    { path: Routes.Session, component: () => import('../pages/Session.vue') },
    { path: Routes.SessionList, component: () => import('../pages/SessionList.vue') },
  ],
});

/**
 * Global Navigation Guard for Authentication
 *
 * Enforces auth requirements on route transitions:
 * - Join, Session and Song detail pages: public (no auth required)
 * - Settings: also open to guests holding an active session from a valid PIN
 * - Other pages: require authentication, redirect to Login if not authenticated
 *
 * IMPORTANT: useAuth() is called INSIDE beforeEach to ensure fresh auth state
 * on each navigation. Calling it at module level would result in stale cached state.
 *
 * @param to - Target route
 * @param from - Source route
 * @param next - Navigation callback
 */
router.beforeEach(async (to) => {
  // Fresh auth check on each navigation (useAuth() hooks into Firebase listener)
  const { isAuthenticated, waitForAuthReady } = useAuth();
  const isPublicSongDetailRoute = to.path.startsWith('/song/') && to.path !== Routes.SongCreate;

  // Public routes (Join, Session and Song detail don't require auth)
  if (to.path === Routes.Join || to.path === Routes.Session || isPublicSongDetailRoute) {
    return true;
  }

  if (to.path === Routes.Login) {
    return true;
  }

  // Guests who joined with a valid PIN can still pick theme and color.
  if (to.path === Routes.Settings) {
    const sessionStore = useSessionStore();
    await sessionStore.whenValidated();

    if (sessionStore.hasActiveSession) {
      return true;
    }
  }

  await waitForAuthReady();

  // Protected routes: redirect to Login if not authenticated
  if (!isAuthenticated.value) {
    return { path: Routes.Login };
  }

  return true;
});
