<script setup lang="ts">
  import './styles/global.css';
  import CookieNotice from './components/core/CookieNotice.vue';
  import { useTheme } from './composables/useTheme';

  // Ensure persisted theme is applied before page-specific components render.
  useTheme();
</script>

<template>
  <main>
    <RouterView />
    <CookieNotice />
  </main>
</template>
