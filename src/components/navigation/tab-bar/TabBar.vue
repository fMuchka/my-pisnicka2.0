<script setup lang="ts">
  import type { LucideIcon } from '../../_core/types';
  import { computed } from 'vue';
  import { RouterLink } from 'vue-router';
  export type TabBarPage = {
    icon: LucideIcon;
    label: string;
    link: string;
    id: string;
  };

  const props = defineProps<{ pages: TabBarPage[]; mainPage: TabBarPage; currentPageId: string }>();

  const pagesMidIndex = computed(() => Math.ceil(props.pages.length / 2));
  const leftSidePages = computed(() => props.pages.slice(0, pagesMidIndex.value));
  const rightSidePages = computed(() => props.pages.slice(pagesMidIndex.value));

  const renderPages = computed(() => [
    ...leftSidePages.value,
    props.mainPage,
    ...rightSidePages.value,
  ]);
</script>
<template>
  <nav class="tab-bar">
    <RouterLink
      v-for="p in renderPages"
      :key="p.id"
      :to="p.link"
      :class="['tab', { 'tab--active': p.id === currentPageId, 'tab--main': p.id === mainPage.id }]"
      :aria-current="p.id === currentPageId ? 'page' : undefined"
    >
      <span
        v-if="p.id === mainPage.id"
        class="tab-main-circle"
      >
        <component
          :is="p.icon.component"
          class="tab-icon"
          v-bind="p.icon.props"
        />
      </span>
      <component
        :is="p.icon.component"
        v-else
        class="tab-icon"
        v-bind="p.icon.props"
      />
      {{ p.label }}
    </RouterLink>
  </nav>
</template>
<style scoped>
  .tab-bar {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    align-items: end;
    padding: var(--space-md) var(--space-sm);
    padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
    background: var(--surface-raised);
    border-top: 1px solid var(--border);
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    font: var(--text-label);
    font-weight: 600;
    color: var(--ink-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .tab:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }

  .tab--active,
  .tab--main {
    color: var(--brand);
  }

  /* Touch devices keep :hover after a tap, which would leave a tab falsely highlighted. */
  @media (hover: hover) and (pointer: fine) {
    .tab:hover {
      color: var(--brand);
    }
  }

  .tab-icon {
    width: 28px;
    height: 28px;
  }

  .tab-main-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin-top: -48px;
    border-radius: var(--radius-full);
    background: var(--brand);
    color: var(--surface);
    box-shadow: var(--shadow-accent);
    transition: box-shadow var(--transition-normal);
  }

  .tab--active .tab-main-circle {
    box-shadow:
      0 0 0 6px var(--brand-soft),
      var(--shadow-accent);
  }
</style>
