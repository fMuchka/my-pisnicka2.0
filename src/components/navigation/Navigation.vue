<script setup lang="ts">
  import { HomeIcon, Info, Music, Settings, Users } from 'lucide-vue-next';
  import { useElementSize } from '@vueuse/core';
  import { computed, onBeforeUnmount, useTemplateRef, watchEffect } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import Button from '../_core/button/Button.vue';
  import SideMenu from './side-menu/SideMenu.vue';
  import TabBar, { type TabBarPage } from './tab-bar/TabBar.vue';
  import TopNavigation from './top-navigation/TopNavigation.vue';
  import UserOptions from './top-navigation/options/UserOptions.vue';
  import { useAuth } from '../../composables/useAuth';
  import { useDeviceViewType } from '../../composables/useDeviceViewType';
  import { pageNavigation } from '../../composables/usePageNavigation';
  import Routes from '../../router/Routes';
  import { useSessionStore } from '../../stores/session';

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
  const settings: TabBarPage = {
    icon: { component: Settings },
    label: 'Nastavení',
    link: Routes.Settings,
    id: 'settings',
  };
  const tabPages = [home, sessions, info, settings];
  const menuPages = [home, songs, sessions, info, settings];

  const router = useRouter();
  const route = useRoute();
  const { isAuthenticated, isGuest } = useAuth();
  const { isMobile } = useDeviceViewType();
  const sessionStore = useSessionStore();

  // Tabs and menu links lead to host-only pages; guests (PIN / session link) would just bounce to Login.
  const showTabBar = computed(() => isMobile.value && !isGuest.value);

  // Mirrors the router guard, so the button never leads to a Login bounce.
  const canOpenSettings = computed(() => isAuthenticated.value || sessionStore.hasActiveSession);

  const currentPageId = computed(() => {
    if (route.path.startsWith('/song/')) return songs.id;
    if (route.path === Routes.Session) return sessions.id;

    return [...tabPages, songs].find((p) => p.link === route.path)?.id ?? '';
  });

  const goHome = () => {
    router.push({ path: isAuthenticated.value ? Routes.Home : Routes.Login });
  };

  const openSettings = (closeMenu?: () => void) => {
    closeMenu?.();
    router.push(Routes.Settings);
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
    >
      <!-- Guests have no tab bar, so this is their only way to Settings on mobile. -->
      <template
        v-if="!showTabBar && canOpenSettings"
        #actions
      >
        <Button
          :icon="{ component: Settings, position: 'prepend' }"
          style-variation="text"
          aria-label="Nastavení"
          @click="openSettings()"
        />
      </template>
    </TopNavigation>
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
      <SideMenu
        :pages="isGuest ? [] : menuPages"
        :current-page-id="currentPageId"
      >
        <template #actions="{ close }">
          <UserOptions />
          <Button
            v-if="canOpenSettings"
            :icon="{ component: Settings, position: 'prepend' }"
            style-variation="text"
            aria-label="Nastavení"
            @click="openSettings(close)"
          />
        </template>
      </SideMenu>
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
