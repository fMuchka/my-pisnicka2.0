import { createRouter, createWebHistory } from 'vue-router';
import Routes from './Routes';
import { useAuth } from '../composables/useAuth';

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
    { path: Routes.Join, component: () => import('../pages/Join.vue') },
    { path: Routes.Session, component: () => import('../pages/Session.vue') },
  ],
});

/**
 * Global Navigation Guard for Authentication
 *
 * Enforces auth requirements on route transitions:
 * - Join and Session pages: public (no auth required)
 * - Other pages: require authentication, redirect to Login if not authenticated
 *
 * IMPORTANT: useAuth() is called INSIDE beforeEach to ensure fresh auth state
 * on each navigation. Calling it at module level would result in stale cached state.
 *
 * @param to - Target route
 * @param from - Source route
 * @param next - Navigation callback
 */
router.beforeEach((to, _from, next) => {
  // Fresh auth check on each navigation (useAuth() hooks into Firebase listener)
  const { isAuthenticated } = useAuth();

  // Public routes (Join and Session don't require auth)
  if (to.path === Routes.Join || to.path === Routes.Session) {
    next();
  } else {
    // Protected routes: redirect to Login if not authenticated
    if (to.path !== Routes.Login && !isAuthenticated.value) {
      next({ path: Routes.Login });
    } else {
      next();
    }
  }
});
