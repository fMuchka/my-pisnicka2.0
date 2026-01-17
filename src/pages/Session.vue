<script setup lang="ts">
  import PageHeader from '../components/PageHeader.vue';

  const TITLE = 'Parta';
  const TAG_LINE = 'Spolu teď a tady';
</script>

<template>
  <div
    class="container"
    data-testid="session-view"
  >
    <PageHeader
      :title="TITLE"
      :tagline="TAG_LINE"
    />
  </div>
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);

    place-content: center;
  }
</style>
