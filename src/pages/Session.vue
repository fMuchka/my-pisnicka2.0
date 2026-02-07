<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import PageHeader from '../components/PageHeader.vue';

  const TITLE = 'Relace';
  const TAG_LINE = 'Spolu teď a tady';

  const route = useRoute();
  const sessionId = computed(() => {
    const value = route.query.sessionId;
    return typeof value === 'string' ? value : '';
  });
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
    <p
      v-if="sessionId"
      class="session-id"
      data-testid="session-id"
    >
      Relace: {{ sessionId }}
    </p>
    <p
      v-else
      class="session-id"
    >
      Relace není vybrána.
    </p>
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

  .session-id {
    margin-top: var(--space-md);
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-align: center;
  }
</style>
