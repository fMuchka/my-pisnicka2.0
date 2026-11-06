import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';
// Applies the saved theme on import, before anything renders, so there's no flash of the default one.
import './hooks/useTheme';
import { createAppRouter } from './router';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      void updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// The app used to keep songs on the device; they now stay in memory for the visit only.
// TODO: Drop this once installs from before the switch are gone.
try {
  indexedDB.deleteDatabase('mypisnicka');
  localStorage.removeItem('mypisnicka_cache_ts');
} catch {
  // Storage blocked: there's nothing of ours to clean up then.
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RouterProvider router={createAppRouter()} />
  </StrictMode>
);
