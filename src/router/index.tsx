import type { ComponentType } from 'react';
import { createBrowserRouter, redirect, type RouteObject } from 'react-router';
import App from '../App';
import LoadingSpinner from '../components/_core/loading-spinner/LoadingSpinner';
import { isAuthenticated, waitForAuthReady } from '../hooks/useAuth';
import { selectHasActiveSession, useSessionStore } from '../stores/session';
import Routes from './Routes';

/**
 * Route guards run as loaders, i.e. before the page renders (like vue-router's beforeEach).
 * Routes without a loader (Login, Join, Session, Song detail) are public.
 */
const requireHost = async () => {
  await waitForAuthReady();

  if (!isAuthenticated()) {
    throw redirect(Routes.Login);
  }

  return null;
};

// Guests who joined with a valid PIN can still pick theme and color.
const requireHostOrSessionGuest = async () => {
  const sessionStore = useSessionStore.getState();
  await sessionStore.whenValidated();

  if (selectHasActiveSession(useSessionStore.getState())) {
    return null;
  }

  return requireHost();
};

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  {
    Component: App,
    HydrateFallback: LoadingSpinner,
    children: [
      { path: Routes.Home, loader: requireHost, lazy: page(() => import('../pages/home/Home')) },
      { path: Routes.Login, lazy: page(() => import('../pages/login/Login')) },
      { path: Routes.Info, loader: requireHost, lazy: page(() => import('../pages/Info')) },
      {
        path: Routes.Settings,
        loader: requireHostOrSessionGuest,
        lazy: page(() => import('../pages/Settings')),
      },
      { path: Routes.Join, lazy: page(() => import('../pages/Join')) },
      {
        path: Routes.SongLibrary,
        loader: requireHost,
        lazy: page(() => import('../pages/SongLibrary')),
      },
      { path: Routes.SongCreate, loader: requireHost, lazy: page(() => import('../pages/Song')) },
      { path: Routes.Song, lazy: page(() => import('../pages/Song')) },
      { path: Routes.Session, lazy: page(() => import('../pages/Session')) },
      {
        path: Routes.SessionList,
        loader: requireHost,
        lazy: page(() => import('../pages/SessionList')),
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
