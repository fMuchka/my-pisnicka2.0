<script setup lang="ts">
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';

  const TITLE = 'Seznam Relací';
  const TAG_LINE = 'Vzpomínky nemizí';
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
  />
  <div
    class="container"
    data-testid="session-view"
  ></div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 400px;
    margin: auto;
    width: 100%;

    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
  }

  .session-id {
    margin-top: var(--space-md);
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-align: center;
  }
</style>
