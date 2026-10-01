<script setup lang="ts">
  import { h, onMounted, ref, type FunctionalComponent } from 'vue';
  import Drawer from '../drawer/Drawer.vue';
  import CookieNoticeBody from './CookieNoticeBody.vue';

  const COOKIE_NOTICE_STORAGE_KEY = 'my-pisnicka:cookie-notice-consent';
  const ACCEPTED_VALUE = 'accepted';
  const COOKIE_NOTICE_TITLE = 'Sušenky, co nešmírují';

  const isVisible = ref(false);

  onMounted(() => {
    const persistedDecision = localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY);
    isVisible.value = persistedDecision !== ACCEPTED_VALUE;
  });

  const handleAccept = () => {
    localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, ACCEPTED_VALUE);
    isVisible.value = false;
  };

  const cookieNoticeContent: FunctionalComponent = () =>
    h(CookieNoticeBody, { onAccept: handleAccept });
</script>

<template>
  <Drawer
    :open="isVisible"
    keep-open
    :title="COOKIE_NOTICE_TITLE"
    :content="cookieNoticeContent"
  />
</template>
