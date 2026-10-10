<script setup lang="ts">
  import './styles/global.css';
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import CookieNotice from './components/cookie-notice/CookieNotice.vue';
  import Navigation from './components/navigation/Navigation.vue';
  import { useTheme } from './composables/useTheme';
  import Routes from './router/Routes';

  // Ensure persisted theme is applied before page-specific components render.
  useTheme();

  const route = useRoute();

  // Before the initial navigation resolves the route is a placeholder '/', which would flash the nav on Login.
  const showNavigation = computed(
    () => route.matched.length > 0 && route.path !== Routes.Login && route.path !== Routes.Join
  );
</script>

<template>
  <Navigation v-if="showNavigation" />
  <main>
    <RouterView />
    <CookieNotice />
  </main>
</template>
