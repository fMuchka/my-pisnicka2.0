<script setup lang="ts">
  import { HomeIcon, Info, Music, Users } from 'lucide-vue-next';
  import { useElementSize } from '@vueuse/core';
  import { computed, onBeforeUnmount, useTemplateRef, watchEffect } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import TabBar, { type TabBarPage } from './tab-bar/TabBar.vue';
  import TopNavigation from './top-navigation/TopNavigation.vue';
  import AppOptions from './top-navigation/options/AppOptions.vue';
  import UserOptions from './top-navigation/options/UserOptions.vue';
  import { useAuth } from '../../composables/useAuth';
  import { useDeviceViewType } from '../../composables/useDeviceViewType';
  import { pageNavigation } from '../../composables/usePageNavigation';
  import Routes from '../../router/Routes';

  const fadeAway = computed(() => pageNavigation.value.fadeAway ?? false);

  const home: TabBarPage = {
    icon: { component: HomeIcon },
    label: 'Domů',
    link: Routes.Home,
    id: 'home',
  };
  const sessions: TabBarPage = {
    icon: { component: Users },
    label: 'Relace',
    link: Routes.SessionList,
    id: 'session',
  };
  const info: TabBarPage = {
    icon: { component: Info },
    label: 'Info',
    link: Routes.Info,
    id: 'info',
  };
  const songs: TabBarPage = {
    icon: { component: Music },
    label: 'Písně',
    link: Routes.SongLibrary,
    id: 'music',
  };
  const tabPages = [home, sessions, info];

  const router = useRouter();
  const route = useRoute();
  const { isAuthenticated, isGuest } = useAuth();
  const { isMobile } = useDeviceViewType();

  // Tabs lead to host-only pages; guests (PIN / session link) would just bounce to Login.
  const showTabBar = computed(() => isMobile.value && !isGuest.value);

  const currentPageId = computed(() => {
    if (route.path.startsWith('/song/')) return songs.id;
    if (route.path === Routes.Session) return sessions.id;

    return [...tabPages, songs].find((p) => p.link === route.path)?.id ?? '';
  });

  const goHome = () => {
    router.push({ path: isAuthenticated.value ? Routes.Home : Routes.Login });
  };

  // The tab bar is fixed, so reserve its height at the bottom of the page or it covers the content.
  const tabBarDock = useTemplateRef<HTMLElement>('tabBarDock');
  const { height: tabBarHeight } = useElementSize(tabBarDock, undefined, { box: 'border-box' });

  watchEffect(() => {
    document.body.style.paddingBottom = showTabBar.value ? `${tabBarHeight.value}px` : '';
  });

  // Not onUnmounted: that runs after the next page's Navigation has already set the padding.
  onBeforeUnmount(() => {
    document.body.style.paddingBottom = '';
  });
</script>

<template>
  <template v-if="isMobile">
    <TopNavigation
      :fade-away="fadeAway"
      @home="goHome"
    />
    <div
      v-if="showTabBar"
      ref="tabBarDock"
      class="tab-bar-dock"
    >
      <TabBar
        :pages="tabPages"
        :main-page="songs"
        :current-page-id="currentPageId"
      />
    </div>
  </template>

  <TopNavigation
    v-else
    :page-title="pageNavigation.pageTitle"
    :fade-away="fadeAway"
    @home="goHome"
  >
    <template #actions>
      <AppOptions />
      <UserOptions />
    </template>
  </TopNavigation>
</template>

<style scoped>
  .tab-bar-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
  }
</style>
