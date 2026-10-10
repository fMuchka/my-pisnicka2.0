<script setup lang="ts">
  import { Tabs } from '@ark-ui/vue/tabs';
  import { History, Route, Info as InfoIcon } from 'lucide-vue-next';
  import { onMounted, ref } from 'vue';
  import {
    getLastVisitedTimelineTime,
    markLatestTimelineAsVisited,
  } from '../lib/timeline/timeline';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import InfoHistory from '../components/info/InfoHistory.vue';
  import InfoRoadmap from '../components/info/InfoRoadmap.vue';
  import InfoGeneral from '../components/info/InfoGeneral.vue';

  const TITLE = 'Informace';
  const TAG_LINE = 'Silmarillion MyPísničky';

  const activeTab = ref('timeline');
  // Read before onMounted overwrites it, so Historie can still tell what is new.
  const lastVisited = getLastVisitedTimelineTime();

  function showHistory() {
    activeTab.value = 'timeline';
  }

  onMounted(() => {
    markLatestTimelineAsVisited();
  });
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
    :show-back="true"
  />

  <section class="container">
    <Tabs.Root
      v-model="activeTab"
      class="info-tabs"
      lazy-mount
      unmount-on-exit
      aria-label="Navigace informační stránky"
    >
      <Tabs.List class="tabs-list">
        <Tabs.Trigger
          class="tabs-trigger"
          value="timeline"
        >
          <History class="tabs-icon" />
          <span>Historie</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          class="tabs-trigger"
          value="roadmap"
        >
          <Route class="tabs-icon" />
          <span>Plány</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          class="tabs-trigger"
          value="general-info"
        >
          <InfoIcon class="tabs-icon" />
          <span>Obecné info</span>
        </Tabs.Trigger>
        <Tabs.Indicator class="tabs-indicator" />
      </Tabs.List>

      <Tabs.Content
        class="tabs-content"
        value="timeline"
      >
        <InfoHistory :last-visited="lastVisited" />
      </Tabs.Content>

      <Tabs.Content
        class="tabs-content"
        value="roadmap"
      >
        <InfoRoadmap @show-history="showHistory" />
      </Tabs.Content>

      <Tabs.Content
        class="tabs-content"
        value="general-info"
      >
        <InfoGeneral @show-history="showHistory" />
      </Tabs.Content>
    </Tabs.Root>
  </section>
</template>

<style lang="css" scoped>
  .container {
    max-width: 760px;
    margin: 0 auto;
    width: 100%;
    padding: var(--space-xl) var(--space-md);
  }

  .info-tabs {
    display: grid;
    gap: var(--space-lg);
  }

  .tabs-list {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-xs);
    padding: var(--space-xs);
    border-radius: 999px;
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    isolation: isolate;
  }

  .tabs-indicator {
    position: absolute;
    z-index: -1;
    height: calc(100% - var(--space-xs) * 2);
    width: var(--width);
    top: var(--space-xs);
    left: var(--left);
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand) 18%, var(--surface));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 50%, var(--border));
    transition-property: left, width;
    transition-duration: var(--transition-normal);
    transition-timing-function: ease-out;
  }

  .tabs-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    padding: 0 var(--space-xs);
    border: none;
    background: transparent;
    color: var(--ink-muted);
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: var(--font-sans);
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .tabs-trigger[data-selected] {
    color: var(--ink);
  }

  .tabs-trigger:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .tabs-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .tabs-content {
    outline: none;
  }

  @media (max-width: 720px) {
    .container {
      padding: var(--space-md);
    }

    .tabs-trigger {
      font-size: 0.82rem;
    }
  }

  @media (max-width: 380px) {
    .tabs-icon {
      display: none;
    }
  }
</style>
