import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';
import { clearExpiredCache } from './lib/songStorage';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

async function init() {
  await clearExpiredCache();
  createApp(App).use(createPinia()).use(router).mount('#app');
}

void init();
