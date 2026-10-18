import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';
// Applies the saved theme on import, before anything renders, so there's no flash of the default one.
import './hooks/useTheme';
import { createAppRouter } from './router';
import { clearExpiredCache } from './lib/songStorage';

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

async function init() {
  await clearExpiredCache();

  createRoot(document.getElementById('app')!).render(
    <StrictMode>
      <RouterProvider router={createAppRouter()} />
    </StrictMode>
  );
}

void init();
