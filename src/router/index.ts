import { createRouter, createWebHistory } from 'vue-router';
import Routes from './Routes';
import { useAuth } from '../composables/useAuth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: Routes.Home, component: () => import('../pages/Home.vue') },
    { path: Routes.Login, component: () => import('../pages/Login.vue') },
  ],
});

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth(); // ✅ Fresh check on each navigation
  if (to.path !== Routes.Login && !isAuthenticated.value) {
    next({ path: Routes.Login });
  } else {
    next();
  }
});
